function Imba(settings) {
    if (settings) {
        this.builds = settings.builds;
        this.jenkinsRootUrl = settings.jenkinsRootUrl;
        this.username = settings.username;
        this.token = settings.token;

    } else {
        throw "Settings are required, or Imba can't figure out what builds to check on, or what credentials to use";
    }
    this.success = 0;
    this.callbackResponses = 0;
    this.failedBuilds = [];
    $("div#imbaJenkinsBuildStatus").append("<div id='imbaJenkinsBuildStatusBall'></div><div id='imbaJenkinsBuildStatusMessages'><b>Checking Build Status</b></div>");

}

Imba.prototype.getSingleBuildStatus = function (buildUrl, successCallback, errorCallback) {
    var that = this;
    var usernameAndToken = this.username + ":" + this.token;
    $.ajax({
        type: "GET",
        url: buildUrl,
        beforeSend: function (xhr) {
            xhr.withCredentials = true;
            xhr.setRequestHeader("Authorization", "Basic " + btoa(usernameAndToken));
        },
        success: function (data) {
            if (successCallback) {
                successCallback(data, that);
            }
        },
        error: function (data, ajaxOptions, thrownError) {
            if (errorCallback) {
                errorCallback(data, that);
            }
        }
    });
};

Imba.prototype.endsWith = function (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

Imba.prototype.beginsWith = function (str, prefix) {
    return str.indexOf(prefix) === 0;
};

Imba.prototype.getJobStatusUrl = function (index) {
    var buildUrl = "";
    if (this.endsWith(this.jenkinsRootUrl, "/")) {
        //ends with /
        buildUrl += this.jenkinsRootUrl;
    } else {
        buildUrl += (this.jenkinsRootUrl + "/");
    }
    buildUrl += "job/";
    var buildName = this.builds[index];
    if (this.beginsWith(buildName, "/")) {
        buildName = buildName.substring(1);
    } else {
        //no starting slash, so no need to do anything
    }
    if (this.endsWith(buildName, "/")) {
        //ending slash is fine, no need to do anything
    } else {
        buildName += "/";
    }

    buildUrl += buildName;
    buildUrl += "lastBuild/api/json";
    return buildUrl;
};

Imba.prototype.getAllBuildStatuses = function () {
    this.lastStartTime = NaN;
    this.success = 0;
    this.failedBuilds = [];
    for (var i = 0; i < this.builds.length; i++) {
        try {
            this.getSingleBuildStatus(this.getJobStatusUrl(i), this.buildStatusCallback, this.buildStatusErrorCallback);
        } catch (err) {
            console.log(err);
        }
    }
};

Imba.prototype.buildStatusErrorCallback = function (data, imbaInstance) {
    imbaInstance.callbackResponses += 1;
};

Imba.prototype.buildStatusCallback = function (data, imbaInstance) {
    imbaInstance.callbackResponses += 1;
    if (data.result != "SUCCESS") {
        imbaInstance.success = -1;
        imbaInstance.failedBuilds.push({
            fullDisplayName: data.fullDisplayName,
            url: data.url
        });
    } else {
        //if success is encountered, check to see if the whole imba has experience failure
        //if it hasn't, upgrade it to success, otherwise do nothing
        if (imbaInstance.success === 0) {
            imbaInstance.success = 1;
        }
    }
    if (imbaInstance.callbackResponses == imbaInstance.builds.length) {
        //now that we've twiddled imba's success, update the view to show what we know so far    
        if (imbaInstance.success >= 0) {
            $("div#imbaJenkinsBuildStatus > div#imbaJenkinsBuildStatusBall").removeClass("imbaFailure");
            $("div#imbaJenkinsBuildStatus > div#imbaJenkinsBuildStatusBall").addClass("imbaSuccess");
            $("div#imbaJenkinsBuildStatus > div#imbaJenkinsBuildStatusMessages").html("<h1>Build Successful</h1>");

        } else {
            $("div#imbaJenkinsBuildStatus > div#imbaJenkinsBuildStatusBall").removeClass("imbaSuccess");
            $("div#imbaJenkinsBuildStatus > div#imbaJenkinsBuildStatusBall").addClass("imbaFailure");
            var failedBuildsHtml = "<b>Failed</b><br/>";
            for (var i = 0; i < imbaInstance.failedBuilds.length; i++) {
                var url = imbaInstance.failedBuilds[i].url;
                var fullDisplayName = imbaInstance.failedBuilds[i].fullDisplayName;
                failedBuildsHtml += ("<a href='" + url + "'>" + fullDisplayName + "</a><br/>");
            }
            $("div#imbaJenkinsBuildStatus > div#imbaJenkinsBuildStatusMessages").html(failedBuildsHtml);
        }

    }

};