package main

import (
	"errors"
	"fmt"
	"strconv"
	"time"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

const keyVersion string = "version"
const keyRecordd string = "recDate"
const keyRecordn string = "recName"

type Records interface {
	Equals(other Records) bool
}
type RecordDate struct {
	RecName string `json:"name"`
	Value int64 `json:"value"`
}
type RecordName struct {
	RecDate string `json:"date"`
	Value int64 `json:"value"`
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
	var bufd []byte
	var bufn []byte
	var err error

	// Construct the new record objects
	rcdd := RecordDate{}
	rcdn := RecordName{}
	switch len(args) {
	case 2:
		rcdn.RecDate = time.Now().Local().Format("20060102")
		rcdd.RecName = args[0]
		rcdn.Value, _ = strconv.ParseInt(args[1], 10, 64)
		rcdd.Value = rcdd.Value
	case 3:
		rcdn.RecDate = args[0]
		rcdd.RecName = args[1]
		rcdn.Value, _ = strconv.ParseInt(args[2], 10, 64)
		rcdd.Value = rcdd.Value
	default:
		return nil, errors.New("Incorrect number of arguments. Expecting 2 or 3 arguments ([date /] key / value)")
	}

	// Read the blockchain for the records
	bufd, err = stub.GetState(rcdn.RecDate)
	if err != nil {
		return nil, err
	}

	bufn, err = stub.GetState(rcdd.RecName)
	if err != nil {
		return nil, err
	}

	// Turn the raw data into structs
	rcdds := make([]RecordDate, 0)
	if len(bufd) > 0 {
		// Previous records exist, append the new record
		err = json.Unmarshal(bufd, &rcdds)
		if err != nil {
			return nil, err
		}
	}
	fndn := false
	for idx, elm := range rcdds {
		if elm.RecName == rcdd.RecName {
			rcdds[idx] = rcdd.Value
			fndn = true
			break
		}
	}
	if !fndn {
		rcdds = append(rcdds, rcdd)
	}

	rcdns := make([]RecordName, 0)
	if len(bufn) > 0 {
		err = json.Unmarshal(bufn, &rcdns)
		if err != nil {
			return nil, err
		}
	}
	fndd := false
	for idx, elm := range rcdns {
		if elm.RecDate == rcdn.RecDate {
			rcdns[idx] = rcnd.Value
			fndd = true
			break
		}
	}
	if !fndd {
		rcdns = append(rcdns, rcdn)
	}

	//write the variable into the chaincode state
	bufd, err = json.Marshal(rcdds)
	if err != nil {
		return nil, err
	}

	bufn, err = json.Marshal(rcdns)
	if err != nil {
		return nil, err
	}

	err = stub.PutState(rcdn.RecDate, bufd)
	if err != nil {
		return nil, err
	}

	err = stub.PutState(rcdd.RecName, bufn)
	if err != nil {
		return nil, err
	}

	return nil, nil
}

// read - query function to read key/value pair
func (t *SimpleChaincode) read(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var buff []byte
	var err error

	lngt := len(args)
	switch lngt {
	case 0:
		buff, err = stub.GetState(keyVersion)
		if err != nil {
			return nil, errors.New("{\"Error\":\"Failed to get chaincode version\"}")
		}
		return buff, nil
	case 1:
		fallthrough
	case 2:
		buff, err = stub.GetState(keyRecord)
		if err != nil {
			return nil, errors.New("{\"Error\":\"Failed to get records\"}")
		}

		records := make([]StruRecord, 0)
		if len(buff) > 0 {
			err = json.Unmarshal(buff, &records)
			if err != nil {
				return nil, err
			}

			for idx := 0; idx < len(records); idx++ {
				if  !(((records[idx].RecDate == args[0]) || (records[idx].RecName == args[0])) ||
					 ((lngt == 2) && (
						((records[idx].RecDate == args[0]) && (records[idx].RecName == args[1])) || 
						((records[idx].RecDate == args[1]) && (records[idx].RecName == args[0]))))) {
					records = append(records[:idx], records[idx+1:]...)
					idx--
				}
			}
		}
	default:
		return nil, errors.New("Incorrect number of arguments. Expecting 0 to 2 arguments")
	}
}

func (self RecordDate) Equals(other Records) bool {
	if (other.(RecordDate).RecName == self.RecName) {
		return true
	} else {
		return false
	}
}
func (self RecordName) Equals(other Records) bool {
	if (other.(RecordName).RecDate == self.RecDate) {
		return true
	} else {
		return false
	}
}

func AppendOrUpdate(record Records, records []Records) bool {
	found := false
	for idx, elm := range records {
		if elm.Equals(record) {
			records[idx] = record
			found = true
			break
		}
	}
	if !found {
		records = append(records, record)
	}
}
	