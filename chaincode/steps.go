package main

import (
	"errors"
	"fmt"
	"time"
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

type SimpleChaincode struct {
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
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
	var key, value string
	var err error

	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2 (key / value pair)")
	}

	key = args[0]
	value = args[1]
	err = stub.PutState(key, []byte(value)) //write the variable into the chaincode state
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
