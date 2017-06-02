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
const keyRecord string = "record"

type StruResult struct {
	Status string `json:"status"`
	Message string `json:"message"`
}
type StruResponse struct {
	Jsonrpc string `json:"jsonrpc"`
	Result StruResult `json:"result"`
	Id int `json:"id"`
}

type StruRecord struct {
	RecDate string `json:"date"`
	RecName string `json:"name"`
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
	err := stub.PutState(keyVersion, []byte(now.Format("20060102150405")))
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
	var buff []byte
	var err error

	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2 (key / value pair)")
	}

	buff, err = stub.GetState(keyRecord)
	if err != nil {
		return nil, err
	}
	logger.Infof("Buffer: '%s'", buff) //TODO TEMP

	records := make([]StruRecord, 0)
	resp := StruResponse{}
	if len(buff) > 0 {
		err = json.Unmarshal(buff, &resp)
		if err != nil {
			return nil, err
		}

		if len(resp.Result.Message) > 0 {
			// Previous records exist, append the new record
			err = json.Unmarshal([]byte(resp.Result.Message), &records)
			if err != nil {
				return nil, err
			}
		}
	}

	// Construct the new record object
	recd := StruRecord{}
	recd.RecDate = time.Now().Local().Format("20060102")
	recd.RecName = args[0]
	recd.Value, err = strconv.ParseInt(args[1], 10, 64)
	logger.Infof("Record: %s : %d", args[0], recd.Value) //TODO TEMP
	records = append(records, recd)

	/*if len(resp.Result.Message) < 1 {
		/ / This is a new chain, add the record
		records = make([]StruRecord, 1)
		records[0] = recd
	} else {
		/ / Previous records exist, append the new record
		records = make([]StruRecord, 0)
		err = json.Unmarshal([]byte(resp.Result.Message), &records)
		if err != nil {
			return nil, err
		}
		records = append(records, recd)
	}*/

	//write the variable into the chaincode state
	buff, err = json.Marshal(records)
	if err != nil {
		return nil, err
	}

	err = stub.PutState(keyRecord, buff)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

// read - query function to read key/value pair
func (t *SimpleChaincode) read(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var key, jsonResp string
	var err error

	if len(args) > 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting name of the key to query")
	}

	key = keyVersion
	if len(args) == 1 {
		key = args[0]
	}

	valAsbytes, err := stub.GetState(key)
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + key + "\"}"
		return nil, errors.New(jsonResp)
	}

	return valAsbytes, nil
}
