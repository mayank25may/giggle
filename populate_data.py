import sys
import os
import random
import requests

def generate_problem(name, solutions, examples):
    files = []
    filename = name + ".csv"
    with open(filename, 'w') as problem_file:
        files.append(filename)
        for i in xrange(0, examples):
            problem_file.write(str(i + 1) + "," + "A" + "\n")
    solution_counter = 0
    for i in solutions:
            solution_counter += 1
            filename = name + "-" + str(solution_counter) + ".csv"
            with open(filename, 'w') as solution_file:
                files.append(filename)
                for j in xrange(0, examples):
                    correct = random.random()
                    if correct < i:
                        solution_file.write(str(j + 1) + "," + "A" + "\n")
                    else:
                        solution_file.write(str(j + 1) + "," + "B" + "\n")
    return files

def post_problem_with_solutions(url,problem_name,owner_name,problem_description,dataset_location, submitter_name):
    data_files = generate_problem(problem_name, [0.50,0.60,0.70,0.90], 5000)
    results = []
    destination = url + "/submit/problem/"
    data = {"problem_name": problem_name,
               "owner_name": owner_name,
               "problem_description": problem_description,
               "dataset_location": dataset_location}
    files = {"file":(data_files[0], open(data_files[0]))}
    result = requests.post(destination,params=data,files=files)
    results.append(result)
    problem_id = result.json()["result"]
    for solution_file in data_files[1:]:
        destination = url + "/submit/solution/"
        data = {"problem_id":problem_id,
               "submitter_name": submitter_name}
        files = {"file":(solution_file, open(solution_file))}
        result = requests.post(destination,params=data,files=files)
        results.append(result)
    for file in data_files:
        os.remove(file)
    return results

def generate_data(url):
    post_problem_with_solutions(url, "DS-1", "mayank@gmail.com", "Title Classification", "s3://benchmarks/DS1", "mayank1@gmail.com")
    post_problem_with_solutions(url, "DS-2", "mayank@gmail.com", "Attribute Extraction", "s3://benchmarks/DS2", "mayank1@gmail.com")
    post_problem_with_solutions(url, "DS-3", "mayank@gmail.com", "Matching", "s3://benchmarks/DS3", "mayank1@gmail.com")
    post_problem_with_solutions(url, "DS-4", "mayank@gmail.com", "Query Categorization", "s3://benchmarks/DS4", "mayank1@gmail.com")
    post_problem_with_solutions(url, "DS-5", "mayank@gmail.com", "Image Tags", "s3://benchmarks/DS5", "mayank1@gmail.com")
    post_problem_with_solutions(url, "DS-6", "mayank@gmail.com", "Pack Extraction", "s3://benchmarks/DS6", "mayank1@gmail.com")

if __name__ == "__main__":
    generate_data(sys.argv[1])