# data downloaded from https://www.ssa.gov/OACT/babynames/limits.html
# use this file to turn the above data into usable JSON
# from the root directory of the project, type
# python py_helpers/name_getter.py PATH_TO_UNZIPPED_DATA

import sys
import os
import json
from states import states
path_to_unzipped_data = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~') + '/Downloads/namesbystate'

aggregate_data = {
  'maleData': {},
  'femaleData': {}
}

for state in states:
  file_path = path_to_unzipped_data + "/{}.TXT".format(state['abbreviation'])
  try:
    state_dict = {
      'stateName': state['name'],
      'abbreviation': state['abbreviation'],
      'maleData': {},
      'femaleData': {},
    }
    with open(file_path, 'r') as file:
      for row in file.readlines():
        data = row.strip().split(",")
        year = data[2]
        name = data[3]
        count = int(data[4])
        gender = 'maleData' if data[1] == 'M' else 'femaleData'
        # update state data
        if state_dict[gender].get(year):
          state_dict[gender][year]['names'][name] = count
        else:
          state_dict[gender][year] = {'names': {name: count}}
        # update aggregate data
        if aggregate_data[gender].get(year):
          if aggregate_data[gender][year]['names'].get(name):
            aggregate_data[gender][year]['names'][name] += count
          else:
            aggregate_data[gender][year]['names'][name] = count
        else:
          aggregate_data[gender][year] = {'names': {name: count}}
    with open('./assets/json/{}.json'.format(state['abbreviation']), 'w') as f:
      json.dump(state_dict, f)
  except FileNotFoundError as e:
    print("{} is an invalid file path; no state data can be found. Please try again.".format(file_path))
    break
with open('./assets/json/aggregate.json', 'w') as f:
  json.dump(aggregate_data, f)


# import requests
# from requests.exceptions import ConnectionError
# from bs4 import BeautifulSoup
# from states import states
# import json
# import re


# years = [str(num) for num in range(1960,2016)]
# BASE_URL = 'https://www.ssa.gov/cgi-bin/namesbystate.cgi'

# state_data = []

# for state in states:
#   new_dict = {
#     'stateName': '',
#     'abbreviation': state,
#     'maleData': [],
#     'femaleData': []
#   }
#   for year in years:
#     r = None
#     while not r:
#       try:
#         r = requests.post(BASE_URL, data={'name': year, 'state': state})
#       except ConnectionError as e:
#         print('connection error, trying again...')
#     html = r.text
#     soup = BeautifulSoup(html, 'html.parser')
#     data_table = soup.find_all('table')[1].find_all('table')[1]
#     if not new_dict['stateName']:
#       caption = data_table.find('caption').text
#       new_dict['stateName'] = re.search(r"in (.*) for", caption).group(1)
#     data_rows = data_table.find_all('tr')[1:]
#     male_data = {'year': int(year), 'names': []}
#     female_data = {'year': int(year), 'names': []}
#     for row in data_rows:
#       tds = row.find_all('td')
#       if tds[1].text != '\xa0':
#         male_data_row = {
#           'rank': int(tds[0].text), 
#           'name': tds[1].text, 
#           'births': int(tds[2].text.replace(",",""))
#         }
#         male_data['names'].append(male_data_row)
#       if tds[3].text != '\xa0':
#         female_data_row = {
#           'rank': int(tds[0].text),
#           'name': tds[3].text,
#           'births': int(tds[4].text.replace(",",""))
#         }
#         female_data['names'].append(female_data_row)
#     new_dict['maleData'].append(male_data)
#     new_dict['femaleData'].append(female_data)
#     print("Finished year {} for {}".format(year, new_dict['stateName']))
#   state_data.append(new_dict)
#   with open('state_data.json', 'w') as f:
#     json.dump(state_data, f)
