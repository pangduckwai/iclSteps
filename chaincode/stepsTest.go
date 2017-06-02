package main

import (
	"fmt"
	"encoding/json"
)

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

func main() {
	dates := make([]RecordDate, 0)
	_ = json.Unmarshal(buildDate(), &dates)

	names := make([]RecordName, 0)
	_ = json.Unmarshal(buildName(), &names)

	eDates := make([]Records, len(dates))
	for idx, elm := range dates {
		eDates[idx] = elm
	}

	eNames := make([]Records, len(names))
	for idx, elm := range names {
		eNames[idx] = elm
	}

	date := RecordDate { RecName: "pete", Value: 9000 }
	if !Update(date, eDates) {
		eDates = append(eDates, date)
	}
	fmt.Printf("pete: %#v\n", eDates)

	date = RecordDate { RecName: "mary", Value: 4321 }
	if !Update(date, eDates) {
		eDates = append(eDates, date)
	}
	fmt.Printf("mary: %#v\n", eDates)

	name := RecordName { RecDate: "20170601", Value: 9000 }
	if !Update(name, eNames) {
		eNames = append(eNames, name)
	}
	fmt.Printf("0601: %#v\n", eNames)

	name = RecordName { RecDate: "20170605", Value: 8000 }
	if !Update(name, eNames) {
		eNames = append(eNames, name)
	}
	fmt.Printf("0605: %#v\n", eNames)
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

func Update(record Records, records []Records) bool {
	found := false
	for idx, elm := range records {
		if elm.Equals(record) {
			records[idx] = record
			found = true
			break
		}
	}
	return found
}

func buildDate() []byte {
	var rcdds = []RecordDate {
		RecordDate { RecName: "paul", Value: 1234 },
		RecordDate { RecName: "john", Value: 2345 },
		RecordDate { RecName: "pete", Value: 3456 },
		RecordDate { RecName: "jack", Value: 4567 },
		RecordDate { RecName: "matt", Value: 5678 },
		RecordDate { RecName: "luke", Value: 6789 },
		RecordDate { RecName: "phil", Value: 7890 },
	}
	buff, _ := json.Marshal(rcdds)
	return buff
}
func buildName() []byte {
	var rcdns = []RecordName {
		RecordName { RecDate: "20170529", Value: 1000 },
		RecordName { RecDate: "20170530", Value: 1200 },
		RecordName { RecDate: "20170531", Value: 1230 },
		RecordName { RecDate: "20170601", Value: 1234 },
		RecordName { RecDate: "20170602", Value: 1235 },
		RecordName { RecDate: "20170603", Value: 1245 },
		RecordName { RecDate: "20170604", Value: 1345 },
	}
	buff, _ := json.Marshal(rcdns)
	return buff
}