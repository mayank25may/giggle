$(document).ready(function() {
    router();
    $('#submit-problem').click(function() {
        window.location.hash = "submitproject";
    })
})

$(window).on('hashchange', function() {
    router();
});


function router() {
    var hash = window.location.hash;

    if (hash == "") {
        showProjectList();
    } else if (hash == "#submitproject") {
        submitProject();
    } else if (hash.split('-') && hash.split('-')[0] == "#showproject") {
        showProject(hash.split('-')[1]);
    } else if (hash.split('-') && hash.split('-')[0] == "#submitprojectsolution") {
        submitProjectSolution(hash.split('-')[1]);
    } else if (hash == "#help") {
        help();
    }
}

function help() {
    $('#main').empty().append('<div class="jumbotron"><br></br> Help </div>');
}


function showProjectList() {
    $.get("/show/problemlist/", function(data) {

        var dataObj = JSON.parse(data);
        $('#main').empty().append('<div class="jumbotron allprojects">\
            <table class="table" id="allprojects">\
                <tr>\
                    <th class="project-name">Project Name</th>\
                    <th>Project Owner</th>\
                    <th>Top Score</th>\
                    <th>Evaluation Metric</th>\
                    <th>Top Scorer Name</th>\
                </tr>\
            </table>\
        </div>');

        for (var i = 0; i < dataObj.result.length; i++) {
            $('#allprojects').append('<tr class="row-data" id="' + dataObj.result[i].problem_id + '"><td>' + dataObj.result[i].problem_name + '</td><td>' + dataObj.result[i].owner_name + '</td><td>' + dataObj.result[i].top_score + '</td><td>' + dataObj.result[i].evaluation_metric + '</td><td>' + dataObj.result[i].top_submitter + '</td></tr>');
        }

        $(".row-data").click(function(event) {
            var projectId = event.currentTarget.id;

            window.location.hash = "showproject-" + projectId;

        });
    });
}

function showProject(projectId) {
    $.get("/show/problem/?problem_id=" + projectId, function(projectData) {
        var projectDataObj = JSON.parse(projectData);
        $('#main').empty().append('<div class="jumbotron project-details" id="">\
            <div class="panel-group" id="accordion" role="tablist" aria-multiselectable="true">\
                <div class="panel panel-default">\
                    <div class="panel-heading" role="tab" id="headingOne">\
                        <h4 class="panel-title">\
                            <a role="button">\
                              Project Details\
                            </a>\
                        </h4>\
                    </div>\
                    <div id="collapseOne">\
                        <div class="panel-body">\
                            <dl class="dl-horizontal">\
                                <dt>Project Name</dt>\
                                <dd>' + projectDataObj.result.problem_name + '</dd>\
                            </dl>\
                            <dl class="dl-horizontal">\
                                <dt>Project Description</dt>\
                                <dd>' + projectDataObj.result.problem_description + '</dd>\
                            </dl>\
                            <dl class="dl-horizontal">\
                                <dt>Project Owner</dt>\
                                <dd>' + projectDataObj.result.owner_name + '</dd>\
                            </dl>\
                            <dl class="dl-horizontal">\
                                <dt>Dataset Location</dt>\
                                <dd>' + projectDataObj.result.dataset_location + '</dd>\
                            </dl>\
                            <dl class="dl-horizontal">\
                                <dt>Evaluation Metric</dt>\
                                <dd>' + projectDataObj.result.evaluation_metric + '</dd>\
                            </dl>\
                        </div>\
                        <div class="navbar-collapse collapse navbar-responsive-collapse">\
                            <ul class="nav navbar-nav pull-right">\
                                <button class="btn btn-success logo" type="submit" id="submit-a-solution">Submit a Solution</button>\
                            </ul>\
                        </div>\
                    </div>\
                </div>\
                <br>\
                <div class="panel panel-default">\
                    <div class="panel-heading" role="tab" id="headingTwo">\
                        <h4 class="panel-title">\
                            <a role="button">\
                              Lead Board\
                            </a>\
                        </h4>\
                    </div>\
                    <div id="collapseTwo">\
                        <div class="panel-body">\
                            <table class="table" id="scoreboard">\
                                <tr>\
                                    <th>Name</th>\
                                    <th>Rank</th>\
                                    <th>Score</th>\
                                </tr>\
                            </table>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>');

        var length = 0;
        for (var key in projectDataObj.result.ranks) {
            if (projectDataObj.result.ranks.hasOwnProperty(key)) {
                ++length;
            }
        }

        for (var i = 1; i <= length; i++) {
            $('#scoreboard').append('<tr class="row-data">\
                <td>' + projectDataObj.result.ranks[i][0] + '</td>\
                <td>' + i + '</td>\
                <td>' + projectDataObj.result.ranks[i][1] + '</td>\
            </tr>');
        }

        $('#submit-a-solution').click(function() {
            window.location.hash = "submitprojectsolution-" + projectId;
        })
    })
}

function submitProjectSolution(projectId) {
    $('#main').empty().append('\
    <div class="jumbotron submit-solution" id="">\
        <form enctype="multipart/form-data">\
            <div class="form-group">\
                <label for="submitter_name" type="email">Submitter Email</label>\
                <input id="submitter_name" type="text" class="form-control" placeholder="email@email.com">\
            </div>\
            <div class="form-group">\
                <label for="exampleInputFile">Solution File</label>\
                <input type="file" name="file" id="file">\
            </div>\
            <button type="submit" class="btn btn-success pull-right" id="submit-newsolution">Submit</button>\
        </form>\
    </div>');

    $('#submit-newsolution').click(function(event) {
        event.preventDefault();
        if (!$('#submitter_name').val() || !$('#file')[0].files[0]) {
            alert("Please enter all values");
        } else if ($('#submitter_name').val() && $('#submitter_name').val().split('@').length !== 2) {
            alert("Please enter valid Email Id");
        } else if ($('#file')[0].files[0].type !== "text/csv") {
            alert("Please provide a .csv file");
        } else {
            $('.jumbotron').css({
                'opacity': '0.5'
            });
            var formData = new FormData();
            formData.append("problem_id", projectId);
            formData.append("file", $('#file')[0].files[0]);
            formData.append("submitter_name", $('#submitter_name').val());

            $.ajax({
                url: '/submit/solution/',
                type: 'POST',
                xhr: function() {
                    var myXhr = $.ajaxSettings.xhr();
                    if (myXhr.upload) {
                        myXhr.upload.addEventListener('progress', progressHandlingFunction, false);
                    }
                    return myXhr;
                },
                success: function(resultData) {
                    var resultDataObj = JSON.parse(resultData);
                    alert('Your solution score is: ' + resultDataObj.result);
                    window.location.hash = "showproject-" + projectId;
                    $('.jumbotron').css({
                        'opacity': '1'
                    });
                },
                error: function() {
                    alert('Error');
                    $('.jumbotron').css({
                        'opacity': '1'
                    });
                },
                data: formData,
                cache: false,
                contentType: false,
                processData: false
            });
        }
    });

    function progressHandlingFunction(e) {
        if (e.lengthComputable) {
            $('progress').attr({
                value: e.loaded,
                max: e.total
            });
        }
    }
}

function submitProject() {
    $('#main').empty().append('<div class="jumbotron allprojects" id="">\
        <form enctype="multipart/form-data">\
            <div class="form-group">\
                <label for="problem_name">Problem Name</label>\
                <input id="problem_name" type="text" class="form-control" placeholder="My Problem Name">\
            </div>\
            <div class="form-group">\
                <label for="owner_name">Owner Email</label>\
                <input id="owner_name" type="email" class="form-control" placeholder="email@email.com">\
            </div>\
            <div class="form-group">\
                <label for="problem_description">Problem Description</label>\
                <input id="problem_description" type="textarea" class="form-control" placeholder="Description">\
            </div>\
            <div class="form-group">\
                <label for="dataset_location">Data Set Location</label>\
                <input id="dataset_location" type="textarea" class="form-control" placeholder="S3 Location">\
            </div>\
            <div class="form-group">\
                <label for="evaluation_metric">Evaluation Metric</label>\
                <select class="form-control" id="evaluation-metric">\
                    <option value="f1">F1 Score</option>\
                    <option value="auc">AUC</option>\
                    <option value="rmse">RMSE</option>\
                    <option value="error">Error</option>\
                </select>\
            </div>\
            <div class="form-group"">\
                <label>Blind Set</label>\
                <input id="file" name="file" type="file" />\
            </div>\
            <button type="submit" class="btn btn-success pull-right" id="submit-newproblem">Submit</button>\
        </form>\
    </div>');

    $('#submit-newproblem').click(function(event) {
        event.preventDefault();
        if (!$('#problem_name').val() || !$('#owner_name').val() || !$('#problem_description').val() || !$('#dataset_location').val() || !$('#file')[0].files[0]) {
            alert("Please enter all values");
        } else if ($('#owner_name').val() && $('#owner_name').val().split('@').length !== 2) {
            alert("Please enter valid Email Id");
        } else if ($('#file')[0].files[0].type !== "text/csv") {
            alert("Please provide a .csv file");
        } else {
            $('.jumbotron').css({
                'opacity': '0.5'
            });
            var formData = new FormData();
            formData.append("file", $('#file')[0].files[0]);
            formData.append("problem_name", $('#problem_name').val());
            formData.append("owner_name", $('#owner_name').val());
            formData.append("problem_description", $('#problem_description').val());
            formData.append("dataset_location", $('#dataset_location').val());
            formData.append("evaluation_metric", $('#evaluation-metric').val());
            console.log(formData);
            $.ajax({
                url: '/submit/problem/',
                type: 'POST',
                xhr: function() {
                    var myXhr = $.ajaxSettings.xhr();
                    if (myXhr.upload) {
                        myXhr.upload.addEventListener('progress', progressHandlingFunction, false);
                    }
                    return myXhr;
                },
                success: function(resultData) {
                    var resultDataObj = JSON.parse(resultData);
                    alert('Project submitted successfully');
                    window.location.hash = "showproject-" + resultDataObj.result;
                    $('.jumbotron').css({
                        'opacity': '1'
                    });
                },
                error: function() {
                    alert('Error');
                    $('.jumbotron').css({
                        'opacity': '1'
                    });
                },
                data: formData,
                cache: false,
                contentType: false,
                processData: false
            });
        }
    });


    function progressHandlingFunction(e) {
        if (e.lengthComputable) {
            $('progress').attr({
                value: e.loaded,
                max: e.total
            });
        }
    }
}