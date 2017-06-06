package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"time"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

const keyVersion string = "version"

type Record struct {
	Date string `json:"date"`
	Name string `json:"name"`
	Value int64 `json:"value"`
}
type RecordTest struct {
	Date string `json:"date"`
	Name string `json:"name"`
	Value int64 `json:"value"`
	IdxDate []string `json:"idxDate"`
	IdxName []string `json:"idxName"`
}

type SimpleChaincode struct {
}

var logger = shim.NewLogger("iclSteps")

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}

	logger.SetLevel(shim.LogInfo)
	shim.SetLoggingLevel(shim.LogInfo)
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	if len(args) != 0 {
		return nil, errors.New("Incorrect number of arguments. Expecting 0")
	}

	now := time.Now().Local()
	err := stub.PutState(keyVersion, []byte(now.Format("20060102230405")))
	if err != nil {
		return nil, err
	}

	return nil, nil
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	if function == "init" {
		return t.Init(stub, "init", args)
	} else if function == "write" {
		return t.write(stub, args)
	} else {
		fmt.Println("Function " + function + " not found")
	}

	return nil, errors.New("Invoking unknown function: " + function)
}

func (t *SimpleChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	if function == "read" { //read a variable
		return t.read(stub, args)
	} else {
		fmt.Println("Function " + function + " not found")
	}

	return nil, errors.New("Querying unknown function: " + function)
}

// write key/value pair to the ledger
func (t *SimpleChaincode) write(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error
	var inpDate, inpName string
	var inpValu int64
	var recBuf, idxDateBuf, idxNameBuf []byte
	var idxDate, idxName []string

	switch len(args) {
	case 2:
		inpDate = time.Now().Local().Format("20060102")
		inpName = args[0]
		inpValu, _ = strconv.ParseInt(args[1], 10, 64)
	case 3:
		inpDate = args[0]
		inpName = args[1]
		inpValu, _ = strconv.ParseInt(args[2], 10, 64)
	default:
		return nil, errors.New("Incorrect number of arguments. Expecting 2 or 3 arguments ([date /] key / value)")
	}

	rcrd := Record{}
	recKey := inpDate + inpName
	recBuf, err = stub.GetState(recKey)
	if err != nil {
		return nil, err
	}

	if len(recBuf) > 0 {
		err = json.Unmarshal(recBuf, &rcrd)
		if err != nil {
			return nil, err
		}

		if (rcrd.Date == inpDate) && (rcrd.Name == inpName) { // Double check
			rcrd.Value = inpValu

			recBuf, err = json.Marshal(rcrd)
			if err != nil {
				return nil, err
			}

			err = stub.PutState(recKey, recBuf)
			if err != nil {
				return nil, err
			}
		} else {
			return nil, errors.New("{\"Error\":\"Corrupted record " + recKey + " : " + string(recBuf) + "\"}")
		}
	} else {
		rcrd.Date = inpDate
		rcrd.Name = inpName
		rcrd.Value = inpValu
		recBuf, err = json.Marshal(rcrd)
		if err != nil {
			return nil, err
		}

		idxDateBuf, err = stub.GetState(inpName)
		if err != nil {
			return nil, err
		}

		idxNameBuf, err = stub.GetState(inpDate)
		if err != nil {
			return nil, err
		}

		idxDate, err = buildIndex(idxDateBuf, inpName, inpDate)
		if err != nil {
			return nil, err
		}

		idxName, err = buildIndex(idxNameBuf, inpDate, inpName)
		if err != nil {
			return nil, err
		}

		idxDateBuf, err = json.Marshal(idxDate)
		if err != nil {
			return nil, err
		}

		idxNameBuf, err = json.Marshal(idxName)
		if err != nil {
			return nil, err
		}

		err = stub.PutState(recKey, recBuf)
		if err != nil {
			return nil, err
		}

		err = stub.PutState(inpName, idxDateBuf)
		if err != nil {
			return nil, err
		}

		err = stub.PutState(inpDate, idxNameBuf)
		if err != nil {
			return nil, err
		}
	}

	return nil, nil
}

// read - query function to read key/value pair
func (t *SimpleChaincode) read(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error
	var recBuf, idxDateBuf, idxNameBuf []byte

	lngt := len(args)
	switch lngt {
	case 0:
		recBuf, err = stub.GetState(keyVersion)
		if err != nil {
			return nil, errors.New("{\"Error\":\"Failed to get chaincode version\"}")
		}
		return recBuf, nil
//	case 1:
//		fallthrough
	case 2:
		recKey := args[0] + args[1]
		recBuf, err = stub.GetState(recKey)
		if err != nil {
			return nil, errors.New("{\"Error\":\"Failed to get records\"}")
		}

		idxDateBuf, err = stub.GetState(args[1])
		if err != nil {
			return nil, err
		}

		idxNameBuf, err = stub.GetState(args[0])
		if err != nil {
			return nil, err
		}

		rcrd := Record{}
		err = json.Unmarshal(recBuf, &rcrd)
		if err != nil {
			return nil, err
		}

		idxDate := make([]string, 0)
		err = json.Unmarshal(idxDateBuf, &idxDate)
		if err != nil {
			return nil, err
		}

		idxName := make([]string, 0)
		err = json.Unmarshal(idxNameBuf, &idxName)
		if err != nil {
			return nil, err
		}

		test := RecordTest{}
		test.Date = rcrd.Date
		test.Name = rcrd.Name
		test.Value = rcrd.Value
		test.IdxDate = idxDate
		test.IdxName = idxName
		recBuf, err = json.Marshal(test)
		if err != nil {
			return nil, err
		}
		return recBuf, nil
	default:
		return nil, errors.New("Incorrect number of arguments. Expecting 0 or 2 arguments")
	}
}

func buildIndex(buff []byte, key string, value string) ([]string, error) {
	rtrn := make([]string, 0)
	if len(buff) > 0 {
		err := json.Unmarshal(buff, &rtrn)
		if err != nil {
			return nil, err
		}
		for _, elm := range rtrn {
			if elm == value {
				return nil, errors.New("Value '" + value + "' already exists in the index '" + key + "'")
			}
		}
	}

	rtrn = append(rtrn, value)
	sort.Strings(rtrn)
	return rtrn, nil
}
