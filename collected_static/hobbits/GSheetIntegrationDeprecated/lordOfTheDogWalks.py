import datetime

import pygsheets

#authorization
gc = pygsheets.authorize(service_file='/home/pi/DjangoApps/portfolio/the-lord-of-the-dogwalks-dfb34f47dee9.json')

#open the google spreadsheet (where 'PY to Gsheet Test' is the name of my sheet)
sh = gc.open('PY to Gsheet Test')

wksTotals = sh[1]
lastUpdatedDate = wksTotals.Cell("E2").value() 

wks = sh[0]
startPos = len(wks.get_all_records()) + 1

inputData = []
for row in inputData:
	# Create a row
	date = "6/14/22"
	miles = 1.5
	time = "0:30:00"
	new_row = [date, miles, time]

	#update the sheet with the row 
	wks.insert_rows(startPos, number=1, values=new_row)
	startPos+=1

#update our timestamp
lastUpdateDate.set_value(datetime.datetime())
