import random
import flask
from flask import render_template, jsonify
import json
from flask.ext.shelve import get_shelve, init_app
from flask.ext import shelve
from optparse import OptionParser

from flask import Flask, render_template, request, redirect, url_for, send_from_directory
from werkzeug import secure_filename

import os
import sys

import shutil

app = flask.Flask(__name__, static_url_path='')

def create_if_absent(path):
    try:
        os.stat(path)
    except:
        os.mkdir(path)

@app.route('/', methods = ['GET'])
@app.route('/giggle/', methods = ['GET'])
def home():
    return render_template('index.html')

@app.route('/submitproblem/', methods = ['GET'])
def submit_problem_page():
    return render_template('submitproblem.html')

@app.route('/submitsolution/', methods = ['GET'])
def submit_solution_page():
    return render_template('submitsolution.html')

@app.route('/problem/', methods = ['GET'])
def problem():
    return render_template('problem.html')

@app.route('/submit/problem/', methods = ['POST'])
def submit_problem():
    print 'Inside submit'
    problem = {}
    problem_id = "P" + str(random.randint(0, app.config['MAXPROJECTS']))
    problem["problem_id"] = problem_id
    problem["problem_name"] = request.form['problem_name']
    problem["owner_name"] = request.form['owner_name']
    problem["problem_description"] = request.form['problem_description']
    problem["dataset_location"] = request.form['dataset_location']
    problem["blindset"] = os.path.join(app.config['BLINDSET_FOLDER'], problem_id)
    problem["evaluation_metric"] = request.form['evaluation_metric']
    problem["scores"] = []    
    db = get_shelve('c')
    db[problem_id] = problem
    if request.method =='POST':
        file = request.files['file']
        if file:
            print 'File is present'
            filename = problem_id
            file.save(os.path.join(app.config['BLINDSET_FOLDER'], filename))
            return json.dumps({"status":"success","result":problem_id})    
    return json.dumps({"status":"faliure"})

@app.route('/submit/solution/', methods = ['POST'])
def submit_solution():
    def read_file(filename):
        with open(filename) as file:
            result = {}
            for line in file:
                words = line.split(',')
                id = words[0].strip()
                prediction = words[1].strip()
                result[id] = prediction
            return result

    def compare_result(actual, predicted, evaluation_metric):
        total = 0.0
        correct = 0.0
        for id, value in actual.items():
            total += 1
            if predicted.has_key(id):
                if predicted[id] == actual[id]:
                    correct += 1
        return correct/total
                    
    problem_id = request.form['problem_id'];
    submitter_name = request.form['submitter_name'];
    db = get_shelve('c')
    if type(problem_id) != str:
        problem_id = problem_id.encode('utf8')
    problem = db[problem_id]
    if request.method =='POST':
        file = request.files['file']
        if file:
            filename = submitter_name
            file.save(os.path.join(app.config['TEMP_FOLDER'], filename))            
            predicted = read_file(os.path.join(app.config['TEMP_FOLDER'], filename))
            actual = read_file(problem["blindset"])
            evaluation_metric = problem['evaluation_metric']
            score = compare_result(actual, predicted, evaluation_metric)
            problem["scores"].append((submitter_name, score))
    db[problem_id] = problem
    return json.dumps({"status":"success", "result":score})

@app.route('/show/problemlist/', methods = ['GET'])
def show_problems():
    db = get_shelve('c')
    problems = []
    for problem_id in db.keys():
        #if type(problem_id) != str:
        #    problem_id = problem_id.encode('utf8')
        problem = db[problem_id]
        problem["problem_id"] = problem_id
        scores = problem["scores"]
        sorted_scores = sorted(scores, key = lambda x: x[1], reverse = True)
        problem["problem_id"] = problem_id
        problem["top_submitter"] = "NA"
        problem["top_score"] = "NA"
        if len(sorted_scores) > 0:
            problem["top_submitter"] = sorted_scores[0][0]
            problem["top_score"] = sorted_scores[0][1]
        problems.append(problem)
    return json.dumps({"status":"success","result":problems})
        
@app.route('/show/problem/', methods = ['GET'])
def show_leaderboard():
    problem_id = request.args.get('problem_id')
    db = get_shelve('c')
    if type(problem_id) != str:
        problem_id = problem_id.encode('utf8')
    problem = db[problem_id]
    problem["problem_id"] = problem_id
    result = {}
    for key, value in problem.items():
        if key == "scores":
            sorted_scores = sorted(value, key = lambda x: x[1], reverse = True)
            ranks = {}
            curr_rank = 0
            for submitter, score in sorted_scores:
                curr_rank += 1
                ranks[curr_rank] = (submitter, score)
            result["ranks"] = ranks
        else:
            result[key] = value
    return json.dumps({"status":"success","result":result})

@app.route('/delete/<path:problem_id>', methods = ['DELETE'])
def delete_project(problem_id):
    db = get_shelve('c')
    if type(problem_id) != str:
        problem_id = problem_id.encode('utf8')
    
    if problem_id in db.keys():
        del db[problem_id]
        os.remove(app.config['BLINDSET_FOLDER'] + '/' + problem_id)
        message = {
            'message'   :   'Deleted Record: ' + problem_id,
        }
        resp = jsonify(message)
        resp.status_code = 200
    else:
        message = {
            'message'   :   'Not Found: ' + request.url,
        }
        resp = jsonify(message)
        resp.status_code = 404
    db.close()
    return resp

@app.errorhandler(404)
def not_found(error=None):
    message = {
        'status'    :   404,
        'message'   :   'Not Found: ' + request.url,
    }
    resp = jsonify(message)
    resp.status_code = 404

    return resp


if __name__ == '__main__':
    parser = OptionParser()
    parser.add_option("-s", "--shelve-filename", dest="shelve_filename", default="giggle.db")
    parser.add_option("-b", "--blindset-folder", dest="blindset_folder", default="./blindsets",)
    parser.add_option("-t", "--temp-folder", dest="temp_folder", default="./temp")

    (options, args) = parser.parse_args()

    app.config['SHELVE_FILENAME'] = options.shelve_filename
    app.config['BLINDSET_FOLDER'] = options.blindset_folder
    app.config['TEMP_FOLDER'] = options.temp_folder
    app.config['MAXPROJECTS'] = random.randint(0,1e10)

    create_if_absent(options.blindset_folder)        
    create_if_absent(options.temp_folder)        

    shelve.init_app(app)
    app.debug = True
    app.run(host='0.0.0.0', port=5001)
