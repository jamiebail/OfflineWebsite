$(document).ready(function () {

    var currentInspection;
    var userInspectionsAjax;
    var currentUserId;
    // Selecting a user
    $('#user-list li').click(function() {
        $("#inspection-list li").remove();
        lockInterface();
        $.mobile.changePage("#index");
        var userId = $(this).attr("id");

        //setting currentUser in session browser storage to use in grabbing/saving inspections and audit records.
        setSessionData("currentUser", userId);
        deleteOtherUserInspections(userId);
        getUserInspections(userId);
    });

    function deleteOtherUserInspections(userId) {
        userId = JSON.parse(userId);
        var toBeDeleted = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            var item = JSON.parse(localStorage.getItem(localStorage.key(i)));
            if(item.InspectorId != null)
            if (item.InspectorId !== userId) {
                if (!checkIfSubmissionIsResubmission())
                    if (item.LongInspectionSubmission != null) {
                        if (item.LongInspectionSubmission.PreventOverwrite == null) {
                            toBeDeleted.push(key);
                        } 
                    }
                    else if (item.ShortInspectionSubmission != null) {
                        if (item.ShortInspectionSubmission.PreventOverwrite == null) {
                            toBeDeleted.push(key);
                        }
                    } else {
                        toBeDeleted.push(key);
                    }
            } 
        }
        for (var j = 0; j < toBeDeleted.length; j++) {
            deleteStoredItem(toBeDeleted[j]);
        }
    }

    
    
    // Selected an inspection
    var inspection;
    $(document).on('click', '#inspection-list li', function () {
        lockInterface();
        // Grabs the current user's ID to pull inspections from browser storage.
         currentUserId = getSessionData("currentUser");

        //Key for browser-stored inspections : Userid.inspectionId eg)  5.120
        inspection = getLocalData(currentUserId + '.' + $(this).attr("id"));

        // Sets selected inspection as current inspection. Used for reference in saving and dynamic page building later.
        setSessionData("currentInspection", inspection);

        // Parse into object to check if short or long inspection.
        inspection = JSON.parse(inspection);
        switch (inspection.AuditType) {
        case "Short":
        {
            $.mobile.changePage("#shortAudit");
            break;
        }
        case "Long":
        {
            $.mobile.changePage("#longAudit");
            break;
        }
        }
    });

    // Clicking on a resubmission in the sync list.
    $(document).on('click', '#sync-list li', function() {

        // Grabs the current user's ID to pull inspections from browser storage.
        currentUserId = getSessionData("currentUser");

        //Key for browser-stored inspections : Userid.inspectionId eg)  5.120
        inspection = getLocalData(currentUserId + '.' + $(this).attr("id"));

        // Sets selected inspection as current inspection. Used for reference in saving and dynamic page building later.
        setSessionData("currentInspection", inspection);

        // Parse into object to check if short or long inspection.
        inspection = JSON.parse(inspection);
        switch (inspection.AuditType) {
        case "Short": {
            $.mobile.changePage("#index");
            $.mobile.changePage("#shortAudit");
            break;
        }
            case "Long": {
            $.mobile.changePage("#index");
            $.mobile.changePage("#longAudit");
            break;
        }
    }

    });

    function disableInputs() {
        $("#easting input").attr("disabled", true);
        $("#northing input").attr("disabled", true);
    }

    $(document).on('click', '.Tolerable, .Poor', function () {
        $(this).parent().siblings(".deficiencies").slideDown();
        $(this).parent().siblings(".deficiencyName").slideDown();
    });

    $(document).on('click', '.Good, .na', function () {
        $(this).parent().siblings(".deficiencies").slideUp();
        $(this).parent().siblings(".deficiencies").find(".ui-checkbox-on").removeClass("ui-checkbox-on").addClass("ui-checkbox-off");
        $(this).parent().siblings(".deficiencyName").slideUp();

    });

    function populateAnswersShort() {
        var currentInspection = getCurrentInspection();
        if (currentInspection.ShortInspectionSubmission != null) {
            for (var i = 0; i < currentInspection.ShortInspectionSubmission.SectionASubmission.DataGatheringAuditRecord.length; i++) {
                var textQuestion = currentInspection.ShortInspectionSubmission.SectionASubmission.DataGatheringAuditRecord[i];
                var input = document.querySelectorAll("[data-questionid='" + textQuestion.QuestionId + "']");
                if (textQuestion.Answer != null && textQuestion.Answer !== "") {
                    $(input).find("input").val(textQuestion.Answer);
                }
            }
            for (var j = 0; j < currentInspection.ShortInspectionSubmission.SectionASubmission.QuestionsForPartC.length; j++) {
                {
                    var sectionAScored = currentInspection.ShortInspectionSubmission.SectionASubmission.QuestionsForPartC[j];
                    var responses = sectionAScored.SelectedResponses;
                    var questionBox = document.querySelectorAll("[data-baseQuestionid='" + sectionAScored.QuestionId + "']")[0];
                    if ($(questionBox).find(".answered").length > 0 && responses.length > 0) {
                        $(questionBox).find(".answered").removeClass("answered");
                    }
                    for (var m = 0; m < responses.length; m++) {
                        var responseToClick = document.querySelectorAll("[data-responseid='" + responses[m] + "']");
                        responseToClick[0].classList.add("answered");
                    }
                }
            }
            for (var k = 0; k < currentInspection.ShortInspectionSubmission.SectionBSubmission.Questions.length; k++) {
                var complianceQuestion = currentInspection.ShortInspectionSubmission.SectionBSubmission.Questions[k];
                var complianceElement = document.querySelectorAll("[data-questionid='" + complianceQuestion.QuestionId + "']");
                if (complianceQuestion.Compliance == null) {
                    $(complianceElement[0]).attr("data-compliance", 3);
                } else {
                    $(complianceElement[0]).attr("data-compliance", complianceQuestion.Compliance);
                    if (complianceQuestion.Answer != null && complianceQuestion.Answer !== "");
                    {
                        $(complianceElement[0]).find("textarea").val(complianceQuestion.Answer);
                    }
                }
            }

            for (var l = 0; l < currentInspection.ShortInspectionSubmission.SectionCSubmission.Questions.length; l++) {
                {
                    var sectionCScored = currentInspection.ShortInspectionSubmission.SectionCSubmission.Questions[l];
                    var responsesC = sectionCScored.SelectedResponses;
                    for (var n = 0; n < responsesC.length; n++) {
                        var responseToClickC = document.querySelectorAll("[data-responseid='" + responsesC[n] + "']");
                        responseToClickC[0].classList.add("answered");
                    }
                }
            }

         
        }

    }


    function populateAnswersLong() {
        var currentInspection = getCurrentInspection();
        if (currentInspection.LongInspectionSubmission != null) {
            for (var i = 0; i < currentInspection.LongInspectionSubmission.SectionASubmission.DataGatheringAuditRecord.length; i++) {
                var textQuestion = currentInspection.LongInspectionSubmission.SectionASubmission.DataGatheringAuditRecord[i];
                var input = document.querySelectorAll("[data-questionid='" + textQuestion.QuestionId + "']");
                if (textQuestion.Answer != null && textQuestion.Answer !== "") {
                    $(input).find("input").val(textQuestion.Answer);
                }
            }
            for (var j = 0; j < currentInspection.LongInspectionSubmission.SectionASubmission.QuestionsForPartC.length; j++) {
                {
                    var sectionAScored = currentInspection.LongInspectionSubmission.SectionASubmission.QuestionsForPartC[j];
                    var responses = sectionAScored.SelectedResponses;
                    var questionBox = document.querySelectorAll("[data-baseQuestionid='" + sectionAScored.QuestionId + "']")[0];
                    if ($(questionBox).find(".answered").length > 0 && responses.length > 0) {
                        $(questionBox).find(".answered").removeClass("answered");
                    }
                    for (var m = 0; m < responses.length; m++) {
                        var responseToClick = document.querySelectorAll("[data-responseid='" + responses[m] + "']");
                        responseToClick[0].classList.add("answered");
                    }
                }
            }
            $(".ui-checkbox-on").removeClass("ui-checkbox-on").addClass("ui-checkbox-off"); // Remove all previously checked checkboxes to be overwritten by submission view model.
            for (var k = 0; k < currentInspection.LongInspectionSubmission.SectionBSubmission.Questions.length; k++) {
                var complianceQuestion = currentInspection.LongInspectionSubmission.SectionBSubmission.Questions[k];
                var complianceElement = document.querySelectorAll("[data-questionid='" + complianceQuestion.QuestionId + "']");
                if (complianceQuestion.SelectedResponses == null) {
                    $(complianceElement[0]).attr("data-compliance", -1);
                } else {
                    $(complianceElement[0]).attr("data-compliance", complianceQuestion.SelectedResponses);
                    if (complianceQuestion.Answer != null && complianceQuestion.Answer !== "");
                    {
                        $(complianceElement[0]).find("textarea").val(complianceQuestion.Answer);
                    }
                }
                if (complianceQuestion.ResponseValid != null) {
                    $(complianceElement).find("[data-complianceresponse='" + complianceQuestion.ResponseValid + "']").click();
                }
                if (complianceQuestion.SelectedDeficiencies.length > 0 && complianceQuestion.SelectedDeficiencies.length !== 0) {
                    for (var m = 0; m < complianceQuestion.SelectedDeficiencies.length; m++) {
                        var deficiencyElement = '#' + complianceQuestion.SelectedDeficiencies[m];
                        $(complianceElement).find(deficiencyElement).siblings().addClass("ui-checkbox-on").removeClass("ui-checkbox-off");
                    }
                }
            }


            for (var l = 0; l < currentInspection.LongInspectionSubmission.SectionCSubmission.Questions.length; l++) {
                {
                    var sectionCScored = currentInspection.LongInspectionSubmission.SectionCSubmission.Questions[l];
                    var responsesC = sectionCScored.SelectedResponses;
                    for (var n = 0; n < responsesC.length; n++) {
                        var responseToClickC = document.querySelectorAll("[data-responseid='" + responsesC[n] + "']");
                        responseToClickC[0].classList.add("answered");
                    }
                }
            }

            for (var l = 0; l < currentInspection.LongInspectionSubmission.ResponsiblePersonFactorsSubmission.Questions.length; l++) {
                {
                    var sectionCScored = currentInspection.LongInspectionSubmission.ResponsiblePersonFactorsSubmission.Questions[l];
                    var responsesC = sectionCScored.SelectedResponses;
                    for (var n = 0; n < responsesC.length; n++) {
                        var responseToClickC = document.querySelectorAll("[data-responseid='" + responsesC[n] + "']");
                        responseToClickC[0].classList.add("answered");
                    }
                }
            }

            for (var l = 0; l < currentInspection.LongInspectionSubmission.StrategicFactorsSubmission.Questions.length; l++) {
                {
                    var sectionCScored = currentInspection.LongInspectionSubmission.StrategicFactorsSubmission.Questions[l];
                    var responsesC = sectionCScored.SelectedResponses;
                    for (var n = 0; n < responsesC.length; n++) {
                        var responseToClickC = document.querySelectorAll("[data-responseid='" + responsesC[n] + "']");
                        responseToClickC[0].classList.add("answered");
                    }
                }
            }

            $("#longAuditSectionB li").each(function () {
                var buttonName = $(this).data('compliance');
                $(this).find("[data-complianceid=" + buttonName + "]").click();
            });
        }

    }

    $("#responsible-person-header").click(function() {
        $(window).scrollTo('#strategic-factors-partial', 200);
    });

    

    $(".deficiency").click(function () {
        if ($(this).find('input').is(":checked")) {
            $(this).find('input').prop('checked', false);
        } else {
            $(this).find('input').prop('checked', true);

        }
    });

    $(document).on('click', '.ratings li', function () {
        var buttonClicked = $(this);
        buttonClicked.siblings().addClass("translucent").removeClass("opaque");
        buttonClicked.addClass("opaque").removeClass("translucent");
        var colour = buttonClicked.css("background-color");
        var new_col = colour.replace(/rgb/i, "rgba");
        new_col = new_col.replace(/\)/i, ',0.3)');
        var questionBox = ($(this).parent().parent());
        questionBox.css({ "background-color": new_col });
    });

    $(document).on('click', '.ratingsresponses li', function () {
        var buttonClicked = $(this);
        buttonClicked.siblings().addClass("translucent").removeClass("opaque");
        buttonClicked.addClass("opaque").removeClass("translucent");
        var colour = buttonClicked.css("background-color");
        var new_col = colour.replace(/rgb/i, "rgba");
        new_col = new_col.replace(/\)/i, ',0.3)');
        
        var questionBox = ($(this).parent().parent());
        var boxColor = questionBox.css('background-color');
        if (boxColor === "rgb(255, 255, 255)") {
            questionBox.css({ "background-color": new_col });
        }
    });

    function selectDeficiencies(questions) {
        for (var i = 0; i < questions.length; i++) {
            var complianceElement = document.querySelectorAll("[data-questionid='" + questions[i].SimpleQuestion.FormQuestion.Id + "']");
            if (questions[i].SelectedDeficiencies.length > 0 && questions[i].SelectedDeficiencies.length !== 0) {
                for (var m = 0; m < questions[i].SelectedDeficiencies.length; m++) {
                    var deficiencyElement = '#' + questions[i].SelectedDeficiencies[m];
                    var deficiency = $(complianceElement[0]).find(deficiencyElement).siblings();
                    $(deficiency).addClass("ui-checkbox-on").removeClass("ui-checkbox-off");
                }
            }
        }
    }


    $("#riskheader").click(function() {
        $(window).scrollTop(3000);
    });
    
    $("#riskheader").click(function () {
        $(window).scrollTop(3000);
    });

    $(".backButtonLong").click(function () {
        if (!checkIfSubmissionIsResubmission(getCurrentInspection().AuditDetails.InspectionId))
            swal({ title: "Remembered to save?", text: "Returning to inspections without saving risks losing your work. Do you want to save before you return?", type: "warning", showCancelButton: true, confirmButtonColor: "#77d075", confirmButtonText: "Save and return", closeOnConfirm: true }, function() { $.mobile.changePage("#index"), $("#sync-long").click() });
        else
            $.mobile.changePage("#index");
    });

    $(".backToInspections").click(function () {
    if (!checkIfSubmissionIsResubmission(getCurrentInspection().AuditDetails.InspectionId)) // if it isn't a resub. 
        swal({ title: "Remembered to save?", text: "Returning to inspections without saving risks losing your work. Do you want to save before you return?", type: "warning", showCancelButton: true, confirmButtonColor: "#77d075", confirmButtonText: "Save and return", closeOnConfirm: true }, function() { $.mobile.changePage("#index"), $("#sync").click() });
    else
        $.mobile.changePage("#index");
});

    function checkIfSubmissionIsResubmission(submission) {
        var userId = getSessionData("currentUser");
        var submissionId = userId + "." + submission;
        var browserResubs = JSON.parse(getLocalData("auditsForResubmission"));
        if (browserResubs != null) {
            if (browserResubs.includes(submissionId)) {
                return true;
            } else return false;
        }
    }

    $(".backToUsers").click(function () {
        if (userInspectionsAjax != null) {
            userInspectionsAjax.abort();
        }
        swal({ title: "Are you sure?", text: "Returning to the users list will require an active internet connection", type: "warning", showCancelButton: true, confirmButtonColor: "#77d075", confirmButtonText: "Yes, I'm sure!", closeOnConfirm: true }, function () { $.mobile.changePage("#userSelect") });
    });

    function beginShortAudit() {
                $("#map-content-short").slideUp(function() {
            $("#inspection-info").animate({ 'marginTop': '50px' }, 500, function() {
                //$("#tabs").animate({ 'marginTop': '100px' }), 700;
                $("#inspection-info").addClass("headerFixed");
                $("#section-selector").addClass("tabsFixed");
                $("#shortAuditA").addClass("auditFixed");
                $("#shortAuditB").addClass("auditFixed");
                $("#shortAuditC").addClass("auditFixed");
            });
           
        });
        $("#inspectionHeaderTypeShort").slideDown().css("display", "block");;
    }

    $('#shortAuditA #riskheader, #shortAuditA #info-provider-questions h3, #shortAuditA #responsible-person-questions h3, #shortAuditA #occupier-questions h3, #section-b-header ,#section-c-header,#questions-for-part-c h3').click(function () {
        beginShortAudit();
    });

    $(document).on('click','#shortAuditA input, .compliance-group textarea',function() {
        beginShortAudit();
    });

    $(document).on('click', '.delete', function (e) {
        var submission = $(this).parent().parent().parent().attr("id");
        e.stopPropagation();
        swal({ title: "Are you sure?", text: "You will not be able to recover this audit submission!", type: "warning", showCancelButton: true, confirmButtonColor: "#DD6B55", confirmButtonText: "Yes, delete it!", closeOnConfirm: false },
        function () {
        var userId = getSessionData("currentUser");
        var submissionId = userId + "." + submission;
        var inspection = JSON.parse(getLocalData(submissionId));
        deleteResubmission(inspection.AuditDetails);
        console.log("Deleted resubmission "+ submissionId + ": " + inspection.InspectionName);
        $("#sync-list").find("#" + inspection.AuditDetails.InspectionId).fadeOut().remove();
        switch (inspection.AuditType) {
        case "Short":
            inspection.ShortInspectionSubmission = null;
            break;
        case "Long":
            inspection.LongInspectionSubmission = null;
            break;
        }
        swal("Deleted!", "Your submission for "+ inspection.InspectionName +" has been deleted.", "success");
        refreshResubCount();
        if ($("#sync-list li").length === 0) {
            $("#syncPanel").popup("close");
        }
        });
    });

    $(document).on('click', '.resync', function (e) {
        e.stopPropagation();
        var auditId = $(this).parent().parent().parent().attr("id");
        swal({ title: "Are you sure?", text: "Your audit will be saved to the server", type: "warning", showCancelButton: true, confirmButtonColor: "#8CD4F5", confirmButtonText: "Yes, save it!", closeOnConfirm: false },
        function () {
        var userId = getSessionData("currentUser");
        var audit = JSON.parse(getLocalData(userId + "." + auditId));
        switch(audit.AuditType) {
            case "Short":
                switch(audit.ShortInspectionSubmission.FailureType) {
                    case "Sync":
                        synchroniseAudit(audit);
                        break;
                    case "Submit":
                        submitAudit(audit);
                        break;
                }
                break;
            case "Long":
                switch (audit.LongInspectionSubmission.FailureType) {
                    case "Sync":
                        synchroniseAudit(audit);
                        break;
                    case "Submit":
                        submitAudit(audit);
                        break;
                }
                break;
        }
        $(this).toggleClass("syncing");

        if ($("#sync-list li").length === 0) {
            $("#syncPanel").popup("close");
        }
        });
    });

    $('#riskheader, #info-provider-questions h3, #questions-for-part-c h3 ,#responsible-person-questions h3, #occupier-questions h3,  #owner-questions h3, #building-questions h3, #section-b-header-long, #section-c-header-long, #responsible-person-header, #strategic-factors-button').click(function () {
        beginLongAudit();
    });

    $(document).on('click', '#longAuditA input', function () {
        beginLongAudit();
    });

    // Animation to close map panel and adjust css to new view.
    function beginLongAudit() {
        if ($("#map-content-long").css("display") !== "none") {
            $("#map-content-long").slideUp(function() {
                $("#inspection-info-long").animate({ 'marginTop': '50px' }, 500, function() {
                    $("#inspection-info-long").addClass("headerFixed");
                    $("#section-selector-long").addClass("tabsFixedLong");
                    if ($(".responsiblePersonButton").css("display") !== "none") {
                        $("#longAuditA").css("margin-top", "170px");
                        $("#longAuditA").css("margin-top", "170px");
                        $("#longAuditB").css("margin-top", "170px");
                        $("#longAuditC").css("margin-top", "170px");
                        $("#responsibleSection").css("margin-top", "170px");
                        $("#strategicSection").css("margin-top", "170px");
                    } else {
                        $("#longAuditA").css("margin-top", "130px");
                        $("#longAuditA").css("margin-top", "130px");
                        $("#longAuditB").css("margin-top", "130px");
                        $("#longAuditC").css("margin-top", "130px");
                        $("#responsibleSection").css("margin-top", "130px");
                        $("#strategicSection").css("margin-top", "130px");
                    }
                });

            });
        }
    }

    $('.syncPanelButton').click(function () {
        var resubIDs = JSON.parse(getLocalData("auditsForResubmission"));
        if (resubIDs != null) {
            if (resubIDs.length > 0) {
        updateResubmissionList();
                $('#sync-list').listview().listview('refresh');
        $('#syncPanel').css("display", "block");
        $('#syncPanel').popup();
        $("#syncPanel").popup("open");
            }
        }
    });

    $(".toLongButton").click(function () {
        swal({ title: "Are you sure you want to swap to a full audit?", text: "You will not be able to alter the short audit past this point.", type: "warning", showCancelButton: true, confirmButtonColor: "#3FC380", confirmButtonText: "Yes, go to full audit", closeOnConfirm: true },
            function () { 
                // initialise inspection's long audit
                var inspection = getCurrentInspection();
                var baseLongAudit = JSON.parse(getLocalData("BaseLongAudit"));
                baseLongAudit.SectionB = inspection.LongInspection.SectionB;
                inspection.LongInspection = baseLongAudit;
                // transfer prepopulated data to new long inspection model.
                transferPrepopulatesToLong(inspection.ShortInspection, inspection.LongInspection);
                // set flag to true
                inspection.AuditDetails.HasMovedToLong = true;
                // Overwrite the audit type
                inspection.AuditType = "Long";
                var userId = getSessionData("currentUser");
                var browserId = userId + "." + inspection.AuditDetails.InspectionId;
                setLocalData(browserId, JSON.stringify(inspection));
                setSessionData("currentInspection", JSON.stringify(inspection));
                deleteResubmission(inspection.AuditDetails);
                // change page to long audit
                $.mobile.changePage("#longAudit");
            });
    });

    function transferPrepopulatesToLong(shortAudit, longAudit) {
        for (var i = 0; i < shortAudit.SectionA.DataGatheringAuditRecord.Questions.length; i++) {
            var shortQuestions = shortAudit.SectionA.DataGatheringAuditRecord.Questions;
            var shortDisplayName = shortQuestions[i].FormQuestion.SectionHandle;
            switch(shortDisplayName) {
                case "grid_reference_-_northing":
                    shortDisplayName = "northing";
                    break;
                case "grid_reference_-_easting":
                    shortDisplayName = "easting";
                    break;
            }
            for (var j = 0; j < longAudit.SectionA.DataGatheringAuditRecord.Questions.length; j++) {
                var longQuestions = longAudit.SectionA.DataGatheringAuditRecord.Questions;
                var longDisplayName = longQuestions[j].FormQuestion.SectionHandle;
                if (shortDisplayName === longDisplayName) {
                    if (shortQuestions[i].Answer != null)
                        
                        longQuestions[j].Answer = shortQuestions[i].Answer;
                }
            }
        }
    }

    function applyNotRequiredFlags(questions) {
        for (var i = 0; i < questions.length; i++) {
            var question = questions[i].FormQuestion;
            if (question.Required) {
                var input = document.querySelectorAll("[data-questionid='" + question.Id + "'");
                $(input[0]).find("input").addClass("not-required");
            }
        }
    }


    // If user has changed a short audit to long audit, will update the inspections list to show the change without relying on server.
    function checkCorrectAuditTypes() {
        var userId = getSessionData("currentUser");
        $("#inspection-list li").each(function() {
            var id = userId + "." + $(this).attr("id");
            var audit = JSON.parse(getLocalData(id));
            var htmlAuditType = $(this).find(".auditType").html();
            if (htmlAuditType !== audit.AuditType) {
                $(this).find(".auditType").html(audit.AuditType);
            }
        });
    }
     
    function updateResubmissionList() {
        $("#sync-list").empty();
        var userId = getSessionData("currentUser");
        var resubIDs = JSON.parse(getLocalData("auditsForResubmission"));
        resubIDs = getUserResubmissions(resubIDs, userId);
        if(resubIDs  != null){
        for (var i = 0; i < resubIDs.length; i++) {
            inspection = JSON.parse(getLocalData(resubIDs[i]));
            if (inspection.AuditType === "Long") {
                $("#sync-list").append('<li id="' + inspection.AuditDetails.InspectionId + '"><span class="auditName">' + inspection.InspectionName + '</span><div class="timeSent">' + inspection.LongInspectionSubmission.TimeOfFail + '</div>' + '<div class="btnContainer"><div class="ui-btn ui-icon-recycle ui-btn-icon-notext ui-corner-all resync"></div><div class="ui-btn ui-icon-delete ui-btn-icon-notext ui-corner-all delete"></div></div>' + '</span><div class="failType">' + inspection.LongInspectionSubmission.FailureType + "<hr>Full" + '</li>');
        }
            else if (inspection.AuditType === "Short") {
                $("#sync-list").append('<li id="' + inspection.AuditDetails.InspectionId + '"><span class="auditName">' + inspection.InspectionName + '</span><div class="timeSent">' + inspection.ShortInspectionSubmission.TimeOfFail + '</div>' + '<div class="btnContainer"><div class="ui-btn ui-icon-recycle ui-btn-icon-notext ui-corner-all resync"></div><div class="ui-btn ui-icon-delete ui-btn-icon-notext ui-corner-all delete"></div></div>' + '</span><div class="failType">' + inspection.ShortInspectionSubmission.FailureType + "<hr>Short" + '</li>');
            }
            
        }
        $(".resync").button();
        $(".delete").button();
        $(".resync").button('refresh');
        $(".delete").button('refresh');
        }
    }

    $(document).on("click",".failType",function() {

    });

    var limit = 1024 * 1024 * 5; // 5 MB
    var remSpace = limit - unescape(encodeURIComponent(JSON.stringify(localStorage))).length;
    remSpace = remSpace / 1000000;
    //alert(remSpace + "mb left");

function clearPreviousLongAudit() {
    $("#long-section-a-questions #risk-questions").empty();
    $("#long-section-a-questions #info-provider-block").empty();
    $("#long-section-a-questions #responsible-person-block").empty();
    $("#long-section-a-questions #occupier-block").empty();
    $("#long-section-a-questions .sectionCQuestions").empty();
    $("#longAuditSectionB").empty();
    $("#long-section-c-questions").empty();
    $("#questions-for-responsible-person-factors").empty();
    $("#questions-for-strategic-factors").empty();
}

function clearPreviousShortAudit() {
    $("#short-section-a-questions #risk-questions").empty();
    $("#short-section-a-questions #info-provider-block").empty();
    $("#short-section-a-questions #responsible-person-block").empty();
    $("#short-section-a-questions #occupier-block").empty();
    $("#short-section-a-questions .sectionCQuestions").empty();
    $("#shortAuditSectionB").empty();
    $("#short-section-c-questions").empty();
}
$(".copyButtonLong").click(function() {
    var name = $("#person_providing_information_-_name input").val();
    var number = $("#person_providing_information_-_telephone input").val();
    var email = $("#person_providing_information_-_email input").val();
    var position = $("#person_providing_information_-_position input").val();
    var mobile = $("#person_providing_information_-_mobile input").val();
    var mobileShort = $("person_providing_information_-_mobile_number").val();

    var element = $(this).siblings().attr("id");
    switch (element) {
        case "responsible-person-block":
            copyAnswer(name, "#responsible_-_name");
            copyAnswer(position,"#responsible_-_position");
            copyAnswer(number,"#responsible_-_telephone");
            copyAnswer(mobile, "#responsible_-_mobile");
            copyAnswer(email,"#responsible_-_email");
            break;
        case "occupier-block":
            copyAnswer(name, "#occupier_-_name");
            copyAnswer(number,"#occupier_-_telephone");
            copyAnswer(email,"#occupier_-_email");
            break;
        case "owner-block":
            copyAnswer(name, "#owner_-_name");
            copyAnswer(number,"#owner_-_telephone");
            copyAnswer(email,"#property_owner_-_email");
            break;
    }
    BasicValidationChecks();
});


$(".copyButtonShort").click(function () {
    var name = $("#person_providing_information_-_name input").val();
    var number = $("#person_providing_information_-_telephone_number input").val();
    var email = $("#person_providing_information_-_email input").val();
    var position = $("#person_providing_information_-_position input").val();
    var mobile = $("#person_providing_information_-_mobile_number input").val();

    var element = $(this).siblings().attr("id");
    switch (element) {
        case "responsible-person-block":
            copyAnswer(name, "#responsible_person_-_name");
            copyAnswer(position, "#responsible_person_-_position");
            copyAnswer(number, "#responsible_person_-_telephone_number");
            copyAnswer(mobile, "#responsible_person_-_mobile_number");
            copyAnswer(email, "#responsible_person_-_email");
            break;
        case "occupier-block":
            copyAnswer(name, "#registered_-_name_of_occupier");
            copyAnswer(number, "#registered_-_telephone_number");
            break;
    }
    BasicShortValidationChecks();
});

function copyAnswer(answer, destination) {
    if(answer)
        $(destination + " input").val(answer);
}


    $(document).on('input', 'input', function () {
        if ($(this).attr("id") === "post_code") {
            $(this).val(function() { return this.value.toUpperCase(); });
        } 
    });

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    $("#send-btn").click(function() {
        swal({title: "Warning!",text: "Are you sure you want to send all audits to the server?",type: "warning",showCancelButton: true,  confirmButtonText: "Yes, I'm sure",cancelButtonText: "Cancel",closeOnConfirm: true},
            function() {
                resubmitAudits();
                    if ($("#sync-list li").length === 0) {
                        swal("Synchronised", "Your audits have been saved successfully!", "success");
                        $("#syncPanel").popup("close");
                    }
            });
    });

    function lockInterface() {
        $('div.ui-loader').fadeIn();
    }

    function unlockInterface() {
        $('div.ui-loader').fadeOut();
    }


    function resubmitAudits() {
        lockInterface();
        var resubIDs = JSON.parse(getLocalData("auditsForResubmission"));
        var userId = getSessionData("currentUser");
        resubIDs = getUserResubmissions(resubIDs, userId);
        for (var i = 0; i < resubIDs.length; i++) {
            var inspection = JSON.parse(getLocalData(resubIDs[i]));
            if (inspection.AuditType === "Short") {
                if (inspection.ShortInspectionSubmission != null) {
                    switch (inspection.ShortInspectionSubmission.FailureType) {
                    case "Sync":
                        if (synchroniseAudit(inspection, function() {}));
                        break;
                    case "Submit":
                        submitAudit(inspection);
                        break;
                    }
                }
            } else if (inspection.AuditType === "Long") {
                if (inspection.ShortInspectionSubmission != null) {
                    switch (inspection.ShortInspectionSubmission.FailureType)
                    {
                        case "Sync":
                         synchroniseAudit(inspection);
                         break;
                        case "Submit":
                         submitAudit(inspection);
                        break;
                    }
                }
                if (inspection.LongInspectionSubmission != null) {
                    switch (inspection.LongInspectionSubmission.FailureType) {
                    case "Sync":
                        synchroniseAudit(inspection);
                        break;
                    case "Submit":
                        submitAudit(inspection);
                        break;
                    }
                }
            }
        }
        unlockInterface();
    }

    function submitAudit(audit) {
        synchroniseAudit(audit);
        var userId = getSessionData("currentUser");
        //Resets model so server accepts.
        if (audit.AuditType === "Long") {
            delete audit.LongInspectionSubmission.FailureType;
            delete audit.LongInspectionSubmission.PreventOverwrite;
            delete audit.LongInspectionSubmission.TimeOfFail;
            $.ajax({
                url: '/LongAudit/Submit',
                type: 'POST',
                data: JSON.stringify({ longInspection: audit.LongInspectionSubmission, auditDetails: audit.AuditDetails }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                async: false,
                success: function(data) {
                    swal({
                            title: "Success!",
                            text: "Submitted to the server.",
                            type: "success",
                            closeOnConfirm: true
                        },
                        function() {
                            deleteResubmission(audit.AuditDetails);
                            audit.LongInspectionSubmission["PreventOverwrite"] = null;
                            deleteStoredItem(userId + "." + audit.AuditDetails.InspectionId);
                            $("#sync-list").find("#" + audit.AuditDetails.InspectionId).fadeOut().remove();
                            $("#inspection-list").find("#" + audit.AuditDetails.InspectionId).remove();
                            $.mobile.changePage("#index");
                            return true;
                        });

                },
                error: function() {
                    swal({
                        title: "You are currently offline",
                        text: "Saving audit to your device for resubmission.",
                        type: "warning",
                        closeOnConfirm: true
                    });
                    updateCurrentInspection(audit.LongInspectionSubmission, audit.AuditDetails);
                    audit.LongInspectionSubmission["FailureType"] = "Submit";
                    flagInspectionForResubmission(audit.AuditDetails);
                    $("#sync-list").find("#" + audit.AuditDetails.InspectionId).addClass("failedResubmission");
                    return true;
                }
            });
        }
        else if (audit.AuditType === "Short") {
            delete audit.ShortInspectionSubmission.FailureType;
            delete audit.ShortInspectionSubmission.PreventOverwrite;
            delete audit.ShortInspectionSubmission.TimeOfFail;
            $.ajax({
            url: '/ShortAudit/Submit',
            type: 'POST',
            data: JSON.stringify({ shortInspection: audit.ShortInspectionSubmission, auditDetails: audit.AuditDetails }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            async: false,
            success: function (data) {
                swal({
                    title: "Success!",
                    text: "Submitted to the server.",
                    type: "success",
                    closeOnConfirm: true
                },
                function () {
                    audit.ShortInspectionSubmission["PreventOverwrite"] = null;
                    if (audit.LongInspectionSubmission == null && audit.AuditDetails.HasMovedToLong === false) {
                        deleteResubmission(audit.AuditDetails);
                        deleteStoredItem(userId + "." + audit.AuditDetails.InspectionId);
                        $("#sync-list").find("#" + audit.AuditDetails.InspectionId).fadeOut().remove();
                        $("#inspection-list").find("#" + audit.AuditDetails.InspectionId).remove();
                    }
                    $.mobile.changePage("#index");
                    return true;
                });
            },
            error: function() {
                swal({
                    title: "You are currently offline.",
                    text: "Saving audit to your device for resubmission.",
                    type: "warning",
                    closeOnConfirm: true
                }),
                updateCurrentShortInspection(audit.ShortInspectionSubmission, auditDetails);
                audit.ShortInspectionSubmission["FailureType"] = "Submit";
                flagInspectionForResubmission(auditDetails);
                $("#sync-list").find("#" + audit.AuditDetails.InspectionId).addClass("failedResubmission");
                unlockAuditList();
                return true;
            }
            });
            
        }
    }
    
    // Function to synchronise resubmission audits.
    function synchroniseAudit(audit) {
        var userId = getSessionData("currentUser");
        if (audit.AuditType === "Long") {
        // If there is a short audit to be saved to the db after changed to a long audit.

            $.ajax({
                url: '/LongAudit/Synchronise',
                type: 'POST',
                data: JSON.stringify({ longInspection: audit.LongInspectionSubmission, auditDetails: audit.AuditDetails }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                beforeSend: function () {
                    lockAuditList();
                },
                async: false,
                success: function (data) {
                    //Deletes the inspection ID from the list of resubmissions.
                    deleteResubmission(audit.AuditDetails);
                    if (data.newId != null) {
                        audit.AuditDetails.InspectionId = data.newId;
                        audit.AuditDetails.LongAuditId = data.newId;
                    }
                    // Allows the inspection to be updated by the server as both version now match.
                    audit.LongInspectionSubmission["PreventOverwrite"] = null;
                    audit.LatestVersion = true;
                    unlockAuditList();
                    saveAudit(audit);

                    if (data.newId != null && audit.AuditDetails.ShortAuditId != null)
                        deleteStoredItem(getSessionData("currentUser") + "." + audit.AuditDetails.ShortAuditId);

                    setSessionData("currentInspection", JSON.stringify(audit));
                    updateInspectionList(audit.AuditDetails.ShortAuditId, audit.AuditDetails.LongAuditId);
                    $("#sync-list").find("#" + audit.AuditDetails.ShortAuditId).fadeOut().remove();
                    $("#sync-list").find("#" + audit.AuditDetails.InspectionId).fadeOut().remove();
                    $("#inspectionHeaderShort").html("Synced to server");
                    $("#inspectionHeaderLong").html("Synced to server");
                    $(".auditHeader").removeClass("syncing").addClass("synced").removeClass("failedsync");
                    swal("Saved!", "Your audit for " + audit.InspectionName + " has been saved to the server.", "success");
                    return true;
                },
                error: function (data) {
                    audit.LongInspectionSubmission["FailureType"] = "Sync";
                    updateCurrentInspection(audit.LongInspectionSubmission, audit.AuditDetails);
                    flagInspectionForResubmission(audit.AuditDetails);
                    $("#sync-list").find("#" + audit.AuditDetails.InspectionId).addClass("failedResubmission");
                    unlockAuditList();
                    audit.LatestVersion = false;
                    swal("You are offline", "Your audit for " + audit.InspectionName + " hasn't been saved to the server, please try again when reconnected.", "error");
                    return true;
                }
                });
            }
        else if (audit.AuditType === "Short") {
            $.ajax({
                url: '/ShortAudit/Synchronise',
                type: 'POST',
                data: JSON.stringify({ shortInspection: audit.ShortInspectionSubmission, auditDetails: audit.AuditDetails }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                beforeSend: function () {
                    lockAuditList();
                },
                async: false,
                success: function (data) {
                    //Deletes the inspection ID from the list of resubmissions.
                    deleteResubmission(audit.AuditDetails);
                    // Allows the inspection to be updated by the server as both version now match.
                    audit.ShortInspectionSubmission["PreventOverwrite"] = null;
                    $("#sync-list").find("#" + audit.AuditDetails.InspectionId).fadeOut().remove();
                    unlockAuditList();
                    saveAudit(audit);
                    $("#inspectionHeaderShort").html("Synced to server");
                    $("#inspectionHeaderLong").html("Synced to server");
                    $(".auditHeader").removeClass("syncing").addClass("synced").removeClass("failedsync");
                    swal("Saved!", "Your audit for " + audit.InspectionName + " has been saved to the server.", "success");
                    return true;
                },
                error: function (data) {
                    audit.ShortInspectionSubmission["FailureType"] = "Sync";
                    updateCurrentShortInspection(audit.ShortInspectionSubmission, audit.AuditDetails);
                    flagInspectionForResubmission(audit.AuditDetails);
                    $("#sync-list").find("#" + audit.AuditDetails.InspectionId).addClass("failedResubmission");
                    unlockAuditList();
                    audit.LatestVersion = false;
                    swal("You are offline", "Your audit for " + audit.InspectionName + " hasn't been saved to the server, please try again when reconnected.", "error");
                    return true;
                }
            });
        }
    }

    function updateInspectionList(oldId, newId) {
        $("#" + oldId).attr("id", newId);
    }

    function saveAudit(audit) {
        var userId = getSessionData("currentUser");
        var auditId = userId + "." + audit.AuditDetails.InspectionId;
        setLocalData(auditId, JSON.stringify(audit));
    }

    function lockAuditList() {
        $("#inspection-list").hide();
    }
    function unlockAuditList() {
        $("#inspection-list").fadeIn();
    }

    function deleteStoredItem(key) {
        localStorage.removeItem(key);
    }

    // Sets the resubmission up for quick sending without having to recalculate.
    function updateCurrentInspection(submission, auditDetails) {
        var userId = getSessionData("currentUser");
        var inspection = JSON.parse(getLocalData(userId + "." + auditDetails.InspectionId));
        inspection.LongInspectionSubmission = submission;
        inspection.AuditDetails = auditDetails;
        inspection.LongInspectionSubmission["PreventOverwrite"] = true;
        inspection.LongInspectionSubmission["TimeOfFail"] = moment().format('MMMM Do YYYY, h:mm:ss a');
        setSessionData("currentInspection", JSON.stringify(inspection));
        setLocalData(userId + '.' + inspection.AuditDetails.InspectionId, JSON.stringify(inspection));
    }

    function updateCurrentShortInspection(submission, auditDetails) {
        var userId = getSessionData("currentUser");
        var inspection = JSON.parse(getLocalData(userId + "." + auditDetails.InspectionId));
        inspection.ShortInspectionSubmission = submission;
        inspection.AuditDetails = auditDetails;
        inspection.ShortInspectionSubmission["PreventOverwrite"] = true;
        inspection.ShortInspectionSubmission["TimeOfFail"] = moment().format('MMMM Do YYYY, h:mm:ss a');
        setLocalData(userId + '.' + inspection.AuditDetails.InspectionId, JSON.stringify(inspection));
    }
            
    // If the sending of an audit fails, save the ID into an array and save in the browser for later reference.
    function flagInspectionForResubmission(inspection) {
        var browserResubs = JSON.parse(getLocalData("auditsForResubmission"));
        var userId = getSessionData("currentUser");
        var resubs = [];
        if (browserResubs != null) {
            browserResubs.push(userId + "." + inspection.InspectionId);
            // Remove duplicates incase of multiple submissions of same Audit
            browserResubs = removeDuplicateInspections(browserResubs);
            setLocalData("auditsForResubmission", JSON.stringify(browserResubs));
            if (browserResubs.length > 0) {
                $(".syncPanelButton").css("display", "block", "important");
                $(".syncPanelButton").text(getUserResubmissions(browserResubs, userId).length + " Audit(s)");
        }
        } else {
            resubs.push(userId + "." + inspection.InspectionId);
            setLocalData("auditsForResubmission", JSON.stringify(resubs));
            refreshResubCount();
    }
    
    }

    //Checks after a successful sync/submit if the audit has a resubmission and deletes it from the resubmission list.
    function deleteResubmission(submission) {
        var userId = getSessionData("currentUser");
        var submissionId = userId + "." + submission.InspectionId;
        var browserResubs = JSON.parse(getLocalData("auditsForResubmission"));
        if (browserResubs != null) {
            if (browserResubs.includes(submissionId)) {
                var index = browserResubs.indexOf(submissionId);
                if (index > -1) {
                    browserResubs.splice(index, 1);
                }
                setLocalData("auditsForResubmission", JSON.stringify(browserResubs));
                refreshResubCount();
            }
        }
    }



    $('#inspectionHeaderTypeShort').click(function() {
        $("#map-content-short").slideDown();
        $("#inspectionHeaderTypeShort").slideUp();
    });
    $('#inspectionHeaderTypeLong').click(function () {
        $("#map-content-long").slideDown();
        $("#inspectionHeaderTypeLong").slideUp();
    });

    $("#section-a-questions h3").click(function() {
        $(this).find('a').toggleClass("sectionShown");
        $("#map-content").slideUp();
        $("#inspectionHeaderType").slideDown().css("display", "block");;
        $(this).parent().siblings().find('a').removeClass("sectionShown");
    });
    var elementCount = 0;

    function applyGridShort() {
        elementCount = 0;
        $("#risk-section .section-a-question").each(function() {
            if (elementCount % 2 === 0) {
                $(this).addClass("ui-block-a");
                elementCount++;
            } else {
                $(this).addClass("ui-block-b");
                elementCount++;
            }
        });
        elementCount = 0;
        $("#info-provider-block .section-a-question").each(function () {
            orderSectionA($(this), elementCount);
        });
        elementCount = 0;
        $("#responsible-person-questions .section-a-question").each(function () {
            orderSectionA($(this), elementCount);
        });
        elementCount = 1;
        $("#occupier-questions .section-a-question").each(function () {
            orderSectionA($(this), elementCount);
        });
        }
    function applyGridLong() {
        elementCount = 0;
        $("#long-section-a-questions #risk-section .section-a-question").each(function () {
            if (elementCount % 2 === 0) {
                $(this).addClass("ui-block-a");
                elementCount++;
            } else {
                $(this).addClass("ui-block-b");
                elementCount++;
            }
        });
        elementCount = 0;
        $("#long-section-a-questions #info-provider-block .section-a-question").each(function () {
            orderSectionA($(this), elementCount);
        });
        elementCount = 0;
        $("#long-section-a-questions #responsible-person-questions .section-a-question").each(function () {
            orderSectionA($(this), elementCount);
        });
        elementCount = 0;
        $("#long-section-a-questions #occupier-questions .section-a-question").each(function () {
            orderSectionA($(this), elementCount);
        });
        elementCount = 0;
        $("#long-section-a-questions #owner-questions .section-a-question").each(function () {
            orderSectionA($(this), elementCount);
        });
        elementCount = 0;
        $("#long-section-a-questions #building-block .section-a-question").each(function () {
            orderSectionA($(this), elementCount);
        });

    
    }

    function getCurrentInspection() {
        var currentInspection = getSessionData("currentInspection");
        currentInspection = JSON.parse(currentInspection);
        return currentInspection;
    }

    function orderSectionA(element) {
        if (elementCount === 0) {
            element.addClass("firstQuestion");
            elementCount++;
            return true;
        }
        if (elementCount % 2 === 0) {
            element.addClass("ui-block-b");
            elementCount++;
        } else {
            element.addClass("ui-block-a");
            elementCount++;
        }
        return true;
    }
    
    function resetElementLocations() {
        $("#inspection-info").css('margin-top', '0px').addClass("resetInspectionInfo").removeClass("headerFixed");
            //$("#tabs").animate({ 'marginTop': '100px' }), 700;
        $("#inspection-info").removeClass("headerFixed");
        $("#section-selector").removeClass("tabsFixed");
        $(".auditFixed").removeClass("auditFixed");
        $("#risk-section").trigger('collapse');
    }
    function resetElementLocationsLong() {
        $("#inspection-info-long").css('margin-top', '0px').addClass("resetInspectionInfo").removeClass("headerFixed");
            //$("#tabs").animate({ 'marginTop': '100px' }), 700;
        $("#inspection-info-long").removeClass("headerFixed");
        $("#section-selector-long").removeClass("tabsFixedLong");
        $(".auditFixedLong").removeClass("auditFixedLong");
        $(".responsiblePersonButton").hide();
        $(".strategicButton").hide();
    }

    $("#index").on('pageshow', function () {
        // Clears the dynamically generated elements on other pages to increase speed.
        clearPreviousLongAudit();
        clearPreviousShortAudit();
        refreshResubCount();
        checkCorrectAuditTypes();
    });

    function refreshResubCount() {
        var browserResubs = JSON.parse(getLocalData("auditsForResubmission"));
        var userId = getSessionData("currentUser");
        if (browserResubs != null) {
            var resubCount = getUserResubmissions(browserResubs, userId);
            if (resubCount != null) {
                if (resubCount.length > 0) {
                    $(".syncPanelButton").fadeIn();
                    $(".syncPanelButton").text(resubCount.length + " Audit(s)");
                } else {
                    $(".syncPanelButton").fadeOut();
                }
            }
        } else {
            $(".syncPanelButton").fadeOut();
        }
    }

    function getUserResubmissions(browserResubmissions, userId) {
        var userResubmissions = [];
        for (var i = 0; i < browserResubmissions.length; i++) {
            if(userId === browserResubmissions[i].split('.', 1)[0]) {
                userResubmissions.push(browserResubmissions[i]);
            }
        }
        return userResubmissions;
    }

    $("#shortAudit").on('pageshow', function (event) {

        // Clears the dynamically generated elements on other pages to increase speed.
        clearPreviousShortAudit();
        clearPreviousLongAudit();
        $('div.ui-loader').fadeOut();
        $("#sectionATab").click();
        var inspection = (getSessionData("currentInspection"));
        inspection = JSON.parse(inspection);

        if (inspection == null) {
            $.mobile.changePage("#userSelect");
        }
        else if (inspection.AuditType === "Long") {
            $.mobile.changePage("#longAudit");
        } else {
            GenerateShortAudit(inspection.ShortInspection);
            applyGridShort();
            initialiseWaves();
            populateAnswersShort();
            applyNotRequiredFlags(inspection.ShortInspection.SectionA.DataGatheringAuditRecord.Questions);
            disableInputs();
            resetElementLocations();
            $(".answered").click();
            $(".answeredSub").addClass("selected");
            $("#shortAuditSectionB li").each(function() {
                var buttonName = $(this).data('compliance');
                $(this).find("[data-complianceid=" + buttonName + "]").click();
            });
            //Set values of Easting/Northing elements for map to use to set view.
            $("#grid_reference_-_easting input").val(inspection.Easting);
            $("#grid_reference_-_northing input").val(inspection.Northing);
            $("#inspection-info").attr('data-fsecgroup', inspection.FsecGroup);

            $("#map-content-short").slideDown(1000, function() {
                initialiseMobileMapShort();
            });
            if (checkIfSavedToBrowser(inspection))
                $(".browserSavedShort").fadeIn();
            else {
                $(".browserSavedShort").fadeOut();
            }
            refreshResubCount();
            BasicShortValidationChecks();
            if (inspection.LatestVersion === true) {
                $("#inspectionHeaderShort").html("Synced to server");
                $(".auditHeader").removeClass("syncing").addClass("synced").removeClass("failedsync");
            } else {
                $("#inspectionHeaderShort").html("Not synced to server");
                $(".auditHeader").removeClass("syncing").removeClass("synced").addClass("failedsync");
            }
            unlockInterface();
        }
    });


    $("#longAudit").on('pagebeforeshow', function (event) {
        lockInterface();
        var inspection = getCurrentInspection();
        $("#popupDialog").css("display", "none");
        $(".inspectionNameLong").html(inspection.InspectionName);
    });
    $("#shortAudit").on('pagebeforeshow', function (event) {
        var inspection = getCurrentInspection();
        $("#popupDialog").css("display", "none");
        $(".inspectionNameShort").html(inspection.InspectionName);
    });

    function raiseAuditForExtraButtons() {
        $('#longAuditA').removeClass("auditFixedLonger");
        $('#longAuditB').removeClass("auditFixedLonger");
        $('#longAuditC').removeClass("auditFixedLonger");
    }

    $("#longAudit").on('pageshow', function (event) {
        clearPreviousLongAudit();
        clearPreviousShortAudit();
        lockInterface();
        $("#map-content-long").slideDown(1000);
        var inspection = (getSessionData("currentInspection"));
        inspection = JSON.parse(inspection);
        if (inspection == null) {
            $.mobile.changePage("#userSelect");
        } else {
            
            GenerateLongAudit(inspection.LongInspection);
            applyGridLong();
            initialiseWaves();
            selectDeficiencies(inspection.LongInspection.SectionB.Questions);
            populateAnswersLong();
            applyNotRequiredFlags(inspection.LongInspection.SectionA.DataGatheringAuditRecord.Questions);
            disableInputs();
            $(".validated").removeClass("validated");
            $(".ratingsresponses .opaque").trigger('click');
            resetElementLocationsLong();
            $("#longAuditSectionB li").each(function() {
                var buttonName = $(this).data('compliance');
                $(this).find("[data-responseid=" + buttonName + "]").click();
            });
            //Set values of Easting/Northing elements for map to use to set view.
            $("#grid_reference_-_easting input").val(inspection.Easting);
            $("#grid_reference_-_northing input").val(inspection.Northing);
            $("#inspection-info-long").attr('data-fsecgroup', inspection.FsecGroup);
            $('#weekdays').find('th').click().removeClass("selected");
            $('#weekends').find('th').click().removeClass("selected");          
            $(".answered").click();
            $(".answeredSub").each(function() {
                if (!$(this).hasClass("selected")) {
                    $(this).click();
                }
            });

            $("#section-a-header-long").click();
            if (checkIfSavedToBrowser(inspection))
                $(".browserSavedLong").fadeIn();
            else {
                $(".browserSavedLong").fadeOut();
            }
            BasicValidationChecks();
            refreshResubCount();
            initialiseMobileMapLong();
            if (inspection.LatestVersion === true) {
                $("#inspectionHeaderLong").html("Synced to server");
                $(".auditHeader").removeClass("syncing").addClass("synced").removeClass("failedsync");
            } else {
                $("#inspectionHeaderLong").html("Not synced to server");
                $(".auditHeader").removeClass("syncing").removeClass("synced").addClass("failedsync");
            }
            unlockInterface();
            $("#longAuditA").css("margin-top", "0px");
            $("#longAuditA").css("margin-top", "0px");
            $("#longAuditB").css("margin-top", "0px");
            $("#longAuditC").css("margin-top", "0px");
            $("#responsibleSection").css("margin-top", "0px");
            $("#strategicSection").css("margin-top", "0px");
            if ($(".responsiblePersonButton").css("display") === "none")
                raiseAuditForExtraButtons();
        }
    });

    function checkIfSavedToBrowser(inspection) {
        var userId = getSessionData("currentUser");
        var savedInspection = getLocalData(userId + "." + inspection.AuditDetails.InspectionId);
        inspection = JSON.stringify(inspection);
        if (inspection === savedInspection)
            return true;
        else {
            return false;
        }
    }

    var mymapshort;
    var mymaplong;
    var markershort;
    var markerlong;
    function initialiseMobileMapShort() {
        // If the map hasn't been initialised on the screen (Jquery mobile keeps all page elements that have been instantiated open), create it.
        if (mymapshort == null) {
            osgb36 = new GT_OSGB(); // Ordinance survey object to convert E/N to Lat/long.
            osgb36.setGridCoordinates($("#grid_reference_-_easting input").val(), $("#grid_reference_-_northing input").val());
            wgs84 = osgb36.getWGS84(); // Conversion to Lat/Lng object.

            mymapshort = L.map('map-short'); // Initialisation of map.
            L.tileLayer('http://{s}.tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png', {
                maxZoom: 17
            }).addTo(mymapshort);
            L.Icon.Default.imagePath = '../../Content/Images';
            markershort = L.marker([wgs84.latitude, wgs84.longitude]).addTo(mymapshort);

            // timeout for invalidateSize(). Checks the dynamic size of the map to allow all mobile screen ranges and refreshes the container.
            setTimeout(function () {
                mymapshort.invalidateSize();
                mymapshort.setView([wgs84.latitude, wgs84.longitude], 20);
            }, 500);
        }
        else // If the map is already initialised, move the marker to the new inspection location.
        {
            osgb36.setGridCoordinates($("#grid_reference_-_easting input").val(), $("#grid_reference_-_northing input").val());
            wgs84 = osgb36.getWGS84();
            var latlng = L.latLng(wgs84.latitude, wgs84.longitude);
            markershort.setLatLng(latlng);
            mymapshort.setView([wgs84.latitude, wgs84.longitude], 20);
            setTimeout(function () {
                mymapshort.invalidateSize();
                mymapshort.setView([wgs84.latitude, wgs84.longitude], 20);
            }, 500);
        }
    
    }

    function initialiseMobileMapLong() {
        var inspection = getSessionData("currentInspection");
        inspection = JSON.parse(inspection);
        // If the map hasn't been initialised on the screen (Jquery mobile keeps all page elements that have been instantiated open), create it.
        if (mymaplong == null) {
            osgb36 = new GT_OSGB(); // Ordinance survey object to convert E/N to Lat/long.
            osgb36.setGridCoordinates(inspection.Easting, inspection.Northing);
            wgs84 = osgb36.getWGS84(); // Conversion to Lat/Lng object.

            mymaplong = L.map('map-long'); // Initialisation of map.
            L.tileLayer('http://{s}.tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png', {
                maxZoom: 17
            }).addTo(mymaplong);
            L.Icon.Default.imagePath = '../../Content/Images';
            markerlong = L.marker([wgs84.latitude, wgs84.longitude]).addTo(mymaplong);

            // timeout for invalidateSize(). Checks the dynamic size of the map to allow all mobile screen ranges and refreshes the container.
            setTimeout(function () {
                mymaplong.invalidateSize();
                mymaplong.setView([wgs84.latitude, wgs84.longitude], 20);
            }, 200);
        }
        else // If the map is already initialised, move the marker to the new inspection location.
        {
            osgb36.setGridCoordinates(inspection.Easting, inspection.Northing);
            wgs84 = osgb36.getWGS84();
            var latlng = L.latLng(wgs84.latitude, wgs84.longitude);
            markerlong.setLatLng(latlng);
            mymaplong.setView([wgs84.latitude, wgs84.longitude], 20);
            setTimeout(function () {
                mymaplong.invalidateSize();
                mymaplong.setView([wgs84.latitude, wgs84.longitude], 20);
            }, 200);
        }
    }


    $(document).ajaxStart(function() {
        $.mobile.loading('show');
    });

    $(document).ajaxStop(function() {
        $.mobile.loading('hide');
    });

    $("#responsible-person-header").on("click", function() {
        $("#longAuditA").hide();
        $("#strategicSection").hide();
        $("#longAuditB").hide();
        $("#longAuditC").hide();
        $("#responsibleSection").show();
        $('html,body').animate({
            scrollTop: 100,
            scrollLeft: 200
        }, 800, function () {
            $('html,body').clearQueue();
        });
    });

    $("#strategic-factors-button").on("click", function () {
        $("#longAuditA").hide();
        $("#longAuditB").hide();
        $("#longAuditC").hide();
        $("#strategicSection").show();
        $("#responsibleSection").hide();
    });

    $(".sectionAButton").on("click", function () {
        $("#responsibleSection").hide();
        $("#strategicSection").hide();
        $("#longAuditA").show();
    });
    $(".sectionBButton").click(function() {
        $("#responsibleSection").hide();
        $("#strategicSection").hide();
    });

    $(".sectionCButton").on("click", function () {
        $("#responsibleSection").hide();
        $("#strategicSection").hide();
    });


    function initialiseWaves() {
        Waves.attach('#section-selector a', ['waves-float']);
        Waves.attach('#section-selector-long a', ['waves-float']);
        Waves.attach('#inspection-info a', ['waves-float']);
        Waves.attach('#inspection-info-long a', ['waves-float']);
        Waves.attach('.ratings li', ['waves-light']);
        Waves.attach('.ratingsresponses li', ['waves-light']);
        Waves.init();
    }

    //function getCachedUserInspections() {
    //    var currentUserId = getCurrentUser();
    //    var userInspections;ap
    //    for ( var i = 0, len = localStorage.length; i < len; ++i ) {
    //        var key = localStorage.key(i);
    //        var userId = (id.split('.', 1))[0];
    //        if (userId === currentUserId) {
                
    //        }

    //    }
    //}


    function getUserInspections(userId) {
        userInspectionsAjax = $.ajax({
            type: "POST",
            url: "/Mobile/ReturnUserInspections",
            dataType: "json",
            data: { id: userId },
            success: function(data) {
                cacheUserInspections(userId, data.UserInspections); // Grabs inspection objects from server and saves to cache if first time or if inspection has been updated server side. 
                getUserInspectionsPartial();
                setLocalData("BaseLongAudit", JSON.stringify(data.BaseLongInspection));
            },
            error: function(data) {
                swal("Grabbing user inspections data failed.", "Please return to the user list and try again.");
            }
        });
    }

    // 
    function getUserInspectionsPartial() {
       userInspectionsAjax = $.ajax({
            type: "GET",
            url: "/Mobile/ReturnUserInspectionsPartial",
            dataType: "html",
            success: function(data) {
                $('#list-container').html(data);
                $('#inspection-list').listview().listview('refresh'); //JqueryMob requirement to bind list to page.
                unlockInterface();
            },
            error: function(data) {
                swal("Grabbing user inspections list failed.", "Please return to the user list and try again.");
                unlockInterface();

            }
        });
    }

    function cacheUserInspections(userId, inspections) {
        for (var i = 0; i < inspections.length; i++) {
            if (checkIfInspectionNeedsUpdating(userId + "." + inspections[i].AuditDetails.InspectionId, inspections[i])) { // Prevents mobile completed submissions from being overwritten.
                inspections[i]["LatestVersion"] = true;
                console.log(inspections[i].InspectionName + " has been updated to the latest server version.");
                setLocalData(userId + "." + inspections[i].AuditDetails.InspectionId, JSON.stringify(inspections[i])); // Will overwrite the inspection if it doesn't exist or doesn't match the locally saved version. 
            }
        }
    }


    function setLocalData(key, data) {
            localStorage.setItem(key, data);
        }

        function getLocalData(key) {
            var item = localStorage.getItem(key);

            if (item == null) {
                return null;
            } else {
                return item;
            }
        }
        
        function clearAllLocalData() {
            var toDelete = [];
            //clears only local data that is to do with the mobile site
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key.substring(0, 2) === "M_") {
                    toDelete.push(key);
                }
            }
            $.each(toDelete, function(index, key) {
                localStorage.removeItem(key);
            });
        }
        
        function clearLocalDataItem(key) {
            if (getLocalData(key) != null) // check it exists before trying to clear it
            {
                localStorage.removeItem(key);
            }
        }

        function checkIfInspectionNeedsUpdating(key, latestInspection) {
            if (checkLocalData(key)) { // If exists
                var storedInspections = getLocalData(key);
                latestInspection = JSON.stringify(latestInspection);
                storedInspections = JSON.parse(storedInspections);
                delete storedInspections.LatestVersion;
                storedInspections = JSON.stringify(storedInspections);
                // Stored version same as server, no need to update.
                if (storedInspections === latestInspection) {
                    storedInspections = JSON.parse(storedInspections);
                    storedInspections["LatestVersion"] = true;
                    console.log(storedInspections.InspectionName + "'s latest version is already saved to device");
                    return false;
                }
                storedInspections = JSON.parse(storedInspections);
                if (storedInspections.ShortInspectionSubmission != null) {
                    // If the audit has been worked on using this device, it will prevent the browser save version from being overwritten.
                    if (storedInspections.ShortInspectionSubmission.PreventOverwrite != null) {
                        console.log("Prevented overwrite of " + storedInspections.InspectionName);
                        return false;
                    } else return true;
                } 
                else if (storedInspections.LongInspectionSubmission != null) {
                    // If the audit has been worked on using this device, it will prevent the browser save version from being overwritten.
                    if (storedInspections.LongInspectionSubmission.PreventOverwrite != null) {
                        console.log("Prevented overwrite of " + storedInspections.InspectionName);
                        return false;
                    } else return true;
                } else {
                    // Server version is different to the stored browser version, browser version hasn't been worked on so update anyway.
                    return true;
                }

            } else return true; // doesn't exist, pop it in localstorage.
        }

        function checkLocalData(key) {
            if (getLocalData(key) == null)
                return false;
            else
                return true;
        }

        function inspectionStart(inspectionId) {
            var inspection = getLocalData(inspectionId);

        }

        function setSessionData(key, value) {
           return sessionStorage.setItem(key, value);
        }

        function getSessionData(key) {
           return sessionStorage.getItem(key);
        }

        function removeDuplicateInspections(inspections) {
            var result = [];
            $.each(inspections, function (i, e) {
                if ($.inArray(e, result) == -1) result.push(e);
            });
            return result;
        }

    $(document).on('click', '.response', function() {
        $(this).addClass("selected");
        var subQuestions = $(this).parent().siblings();
        var questionbox = $(this).closest('.questionBox');
        if (questionbox.attr('id') !== "weekdays" && questionbox.attr('id') !== "weekends") {
            var alternateResponses = $(this).parent().parent().parent().siblings();
            alternateResponses.find(".subResponses").hide();
            alternateResponses.find(".response").removeClass("selected");
            alternateResponses.find(".selectedSub").removeClass("selectedSub").removeClass("selected");
            alternateResponses.find(".answered").removeClass("answeredSub").removeClass("answered");
        } else {
            $(this).removeClass("selected");
        }
        subQuestions.slideDown();
    });

    $(document).on('click', '.subResponse', function () {
        if ($(this).parents(".questionBox")[0].id != "aretherefire-fightingfacilities" &&
            $(this).parents(".questionBox")[0].id != "firefighterhazard" &&
            $(this).parents(".questionBox")[0].id != "smokecontrol" &&
            $(this).parents(".questionBox")[0].id != "firespread-long") {
            $(this).addClass("selectedSub").addClass("selected").removeClass("answeredSub");
            $(this).siblings().removeClass("selectedSub").removeClass("selected");
        } else {
            $(this).toggleClass("selectedSub");
            $(this).toggleClass("selected");
        }
    });


    $(document).on('click', '.answered', function () {
        $(this).parent().siblings().find('.answeredSub').click();
    });

        $(".answered").click();

        $("#section-b-header").click(function () {
            $(window).scrollTo("");
        });


    
}); //  JQUERY END

$(document).on("mobileinit", function () {
    $.mobile.loader.prototype.options.text = "Loading Inspections";
    $.mobile.loader.prototype.options.textVisible = false;
    $.mobile.loader.prototype.options.theme = "b";
    $.mobile.loader.prototype.options.html = "";
});

function initialiseReadOnlyMap(east, north) {
    osgb36 = new GT_OSGB();
    osgb36.setGridCoordinates(east, north);
    wgs84 = osgb36.getWGS84();

    mymap = L.map('map').setView([wgs84.latitude, wgs84.longitude], 18);
    L.tileLayer('http://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(mymap);
    L.Icon.Default.imagePath = '../../Content/Images';
    L.marker([wgs84.latitude, wgs84.longitude]).addTo(mymap);
    
}



addEventListener("click", function () {
    var
          el = document.documentElement
        , rfs =
               el.requestFullScreen
            || el.webkitRequestFullScreen
            || el.mozRequestFullScreen
    ;
    rfs.call(el);
});
