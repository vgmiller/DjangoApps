from django.shortcuts import render, redirect
from hobbits.models import *

def hobbits_index(request):
	currentStatus = CurrentStatus.load()
	summary = currentStatus.summary()
	context = {
		"summary": summary,
		"walks": formatWalks(Walk.objects.order_by('-startDateTime')[:15]),
		"milestones": formatMilestones(MajorMilestone.objects.order_by('position'), summary.get('totalDistanceWalked'))
	}
	return render(request, "hobbits_index.html", context)

def hobbits_log(request):
	context = {
		"walks": formatWalks(Walk.objects.order_by('-startDateTime')),
	}
	return render(request, "hobbits_log.html", context)

def hobbits_refreshData(request):
	try:
		activities = fitbitGetData()
	except:
		reauthFitbit()
		try:
			activities = fitbitGetData()
		except:
			return redirect(hobbits_index)
	importFromJSON(activities)
	return redirect(hobbits_index)

def formatWalks(walkList):
	#from django.utils import timezone
	formattedWalks = []
	for walk in walkList:
		formattedWalks.append({
			#"startDateTime": timezone.localtime(walk.startDateTime),
			"startDateTime": walk.startDateTime,
			"distance": round(walk.distance,2),
			"duration": round(walk.duration/60000, 2), #milliseconds to minutes
			"id": walk.fitbitLogId,
		})
	return formattedWalks

def formatMilestones(msList, totalMiles):
	formattedMs = []
	for ms in msList:
		formattedMs.append({
			"position": ms.position,
			"text": ms.text,
			"distanceFromShire": round(ms.distanceFromShire,0),
			"distanceFromLastMilestone": round(ms.distanceFromLastMilestone, 0),
			"distanceRemaining": round((ms.distanceFromShire-totalMiles),2),
		})
	return formattedMs

def fitbitGetData():
	# This function should be called within a try block only
	import fitbit
	from django.conf import settings
	from datetime import datetime, timedelta
	import os
	consumer_key = settings.FITBIT_CLIENTID
	consumer_secret = settings.FITBIT_CLIENTSECRET
	access_token = os.environ['FITBIT_ACCESS_TOKEN'] if os.environ['FITBIT_ACCESS_TOKEN'] else settings.FITBIT_ACCESS_TOKEN
	refresh_token = os.environ['FITBIT_REFRESH_TOKEN'] if os.environ['FITBIT_REFRESH_TOKEN'] else settings.FITBIT_REFRESH_TOKEN
	startDate = (datetime.today()-timedelta(days=20)).strftime("%Y-%m-%d")
	
	authd_client = fitbit.Fitbit(consumer_key, consumer_secret, access_token=access_token, refresh_token=refresh_token)
	activities = authd_client.activity_logs_list(after_date=startDate, limit=100).get('activities')
	authd_client.sleep()

	return activities

def reauthFitbit():
	"""
	curl -i -X POST https://api.fitbit.com/oauth2/token -H "Authorization: Basic [clientsSecretGoesHere]"  \
	-H "Content-Type: application/x-www-form-urlencoded"  --data "grant_type=refresh_token"  --data "refresh_token=[tokenGoesHere]"
	"""
	import requests, dotenv, os
	from requests.structures import CaseInsensitiveDict
	from django.conf import settings
	dotenv_file = dotenv.find_dotenv(settings.BASE_DIR+"/.env")
	dotenv.load_dotenv(dotenv_file)
	refreshToken = os.environ['FITBIT_REFRESH_TOKEN']
	clientSecret = os.environ['FITBIT_CLIENTSECRET']
	
	url = "https://api.fitbit.com/oauth2/token"
	data = "grant_type=refresh_token&refresh_token=%s"% refreshToken
	headers = CaseInsensitiveDict()
	headers["Authorization"] = "Basic %s" % clientSecret
	headers["Content-Type"] = "application/x-www-form-urlencoded"
	res = requests.post(url, data=data, headers=headers).json()
	newAuthToken = res.get('access_token')
	newRefreshToken = res.get('refresh_token')
	
	os.environ["FITBIT_ACCESS_TOKEN"] = newAuthToken
	dotenv.set_key(dotenv_file, "FITBIT_ACCESS_TOKEN", os.environ["FITBIT_ACCESS_TOKEN"])
	os.environ["FITBIT_REFRESH_TOKEN"] = newRefreshToken
	dotenv.set_key(dotenv_file, "FITBIT_REFRESH_TOKEN", os.environ["FITBIT_REFRESH_TOKEN"])

def importFromJSON(results):
	from dateutil import parser
	for row in results:
		if row.get('activityName')=="Walk" and row.get('logType')=="tracker" and not Walk.objects.filter(fitbitLogId=row.get('logId')).exists():
			newWalk = Walk(startDateTime=parser.parse(row.get('startTime')),
							steps=int(row.get('steps')), 
							distance=float(row.get('distance')), 
							duration=int(row.get('duration')),
							fitbitLogId=row.get('logId'))
			newWalk.save()
	currentStatus = CurrentStatus.load()
	currentStatus.update()

def legacyDataImport(request):
	import csv, os
	from dateutil import parser
	from django.conf import settings
	filepath=os.path.join( settings.STATIC_ROOT, 'hobbits/dogwalks_nonfitbit.csv' )
	with open(filepath, newline='') as csvfile:
		reader = csv.DictReader(csvfile)
		for row in reader:
			if not Walk.objects.filter(fitbitLogId=row.get('UniqueId')).exists():
				newWalk = Walk(startDateTime=parser.parse(row.get('DateTime')),
								distance=float(row.get('Miles')), 
								duration=int(row.get('Milliseconds')),
								fitbitLogId=row.get('UniqueId'))
				newWalk.save()
	currentStatus = CurrentStatus.load()
	currentStatus.update()
	return hobbits_index(request)
