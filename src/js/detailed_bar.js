
function try_acquire_lock(id)
{ // id for infected
    if (detail_bar === 2) return;

    slideOpenRightBar();
    detailedXML = loadXMLDoc(apiUrl + "infected/" + id);
    console.log(detailedXML);
    setDetailedView(detailedXML);
}

// set the detailed view with a given xml file for all specific data
function setDetailedView(xml_doc)
{
    if (xml_doc != null)
    {
        detail_bar = 2;
        symptomsList = [];

        let displayDetailed = getXSLT("./xslt_scripts/xslt_detailed_view.xsl");

        runXSLT(displayDetailed, xml_doc, "infected_detailed_view_right");

        let parseSymptomsXSL = getXSLT("./xslt_scripts/xslt_parse_symptoms.xsl");
        initialSymptoms = runXSLT(parseSymptomsXSL, xml_doc);

        console.log(initialSymptoms);

        let symptomsXSL = getXSLT("./xslt_scripts/xslt_symptom_div.xsl");

        runXSLT(symptomsXSL, initialSymptoms, "symptomsDiv");

        let symp_checkboxes = document.getElementById("symptomsDiv").getElementsByClassName("symptom_checkbox");
        for ( let i = 0; i < symp_checkboxes.length; i++)
        {
            let id = parseInt(symp_checkboxes[i].id.replace("symp_",""));
            symptomsList.push(id);
        }
        console.log(symptomsList);
    }
}

function displayPopUp()
{
    let filter_overlay = document.getElementById("global_overlay");
    let popup_window = document.getElementById("popup_window");
    filter_overlay.className = "";
    popup_window.className = "";
}

function hidePopUp()
{
    let filter_overlay = document.getElementById("global_overlay");
    let popup_window = document.getElementById("popup_window");
    filter_overlay.className = "invisible_object";
    popup_window.className = "invisible_object";
    popup_window.innerHTML = "";
}

function deepCopyXML(node)
{
    let parser = new DOMParser();
    let serializer = new XMLSerializer();
    return parser.parseFromString(serializer.serializeToString(node), "application/xml");
}

function showSymptoms ()
{
    if (!detailedXML) return;
    if ( !symptomsXML ) symptomsXML = loadXMLDoc(apiUrl+"symptom");
    // construct xml document for popup
    let parser = new DOMParser();
    let xmlDocument = constructSymptomPopupXML();

    console.log(xmlDocument);
    var symptomsXSL = getXSLT("./xslt_scripts/xslt_edit_symptoms.xsl");
    runXSLT(symptomsXSL, xmlDocument, "popup_window");

    editSymptomsList = symptomsList;

    displayPopUp();
}

function symptomInteraction(id)
{
    var checkbox = document.getElementById("symptom_"+id);
    editSymptomsList = changeSymptom(checkbox, editSymptomsList, id);
}

function symptomsChanged(id)
{
    var checkbox = document.getElementById("symp_"+id);
    symptomsList = changeSymptom(checkbox, symptomsList, id);
}

function changeSymptom(checkbox, list, id)
{
    if ( !checkbox )
    {
        console.log("Error occurred...");
    }

    if ( checkbox.checked )
    {
        if (list.indexOf(id) === -1) list.push(id);
    }
    else
    {
        const index = list.indexOf(id);
        if (index > -1)
        {
            list.splice(index, 1);
        }
    }
    return list;
}

function showPreExistingIllnesses()
{
    if (!detailedXML) return;
    var illnessXSL = getXSLT("./xslt_scripts/xslt_show_illnesses.xsl");

    runXSLT(illnessXSL, detailedXML, "popup_window");
    displayPopUp();
}

function submitSymptoms()
{
    if ( !symptomsXML ) symptomsXML = loadXMLDoc(apiUrl+"symptom");

    symptomsList = editSymptomsList;
    symptomsList.sort((a, b) => a - b);

    let xmlDoc = constructSymptomPopupXML();
    console.log(xmlDoc);



    let mergeSymptomsXSL = getXSLT("./xslt_scripts/xslt_merge_symptoms.xsl");
    let mergedXML = runXSLT(mergeSymptomsXSL, xmlDoc);
    console.log(mergedXML);

    // reload symptoms_div, then close popup
    let symptomXSL = getXSLT("./xslt_scripts/xslt_symptom_div.xsl");
    runXSLT(symptomXSL, mergedXML, "symptomsDiv");

    hidePopUp();
}

function constructSymptomPopupXML()
{
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString("<symptomPopupXML></symptomPopupXML>", "application/xml");
    xmlDoc.children[0].appendChild(deepCopyXML(initialSymptoms).children[0]);
    xmlDoc.children[0].appendChild(deepCopyXML(symptomsXML).children[0]);
    xmlDoc.children[0].appendChild(constructIdList().children[0]);
    return xmlDoc;
}

function constructIdList()
{
    let parser = new DOMParser();
    let temp_id_string = "<symptomIdList>";
    for (let i = 0; i < symptomsList.length; i++)
    {
        temp_id_string += "<symp_id>"+symptomsList[i]+"</symp_id>";
    }
    return parser.parseFromString(temp_id_string + "</symptomIdList>", "application/xml");
}

function slideOpenRightBar()
{
    let detailedView = document.getElementById("infected_detailed_view_right");
    if (detailedView.className.indexOf("detailed_slideout") > -1 || detailedView.className === "floating_object") {
        detailedView.className = "floating_object detailed_slidein";
    }
}

function closeRightBar()
{
    let detailedView = document.getElementById("infected_detailed_view_right");
    if (detailedView.className.indexOf("detailed_slidein") > -1) {
        detailedView.className = "floating_object detailed_slideout";
    }
}

function prescribeTest(id)
{
    makeConfirmPopup("Wollen Sie einen Test anordnen?",
        function(id) {
            if (detailedXML === null) return;
            // TODO: check whether prescribed, change xml, reload detail view
            // var availableTests = detailedXML.getElementsByTagName("test");
            // console.log(availableTests.lastChild);

            const xml_string = "<Test><infectedId>"+id+"</infectedId><result>0</result><timestamp>"+parseInt(Date.now()/1000.0)+"</timestamp></Test>";
            postRequest("test", xml_string);
        }, function (id) { }, id );
}

function makeConfirmPopup(text, onSubmitCallback, onCancelCallback, parameters)
{
    confirmConfig = [onSubmitCallback, onCancelCallback, parameters];

    const overlay = document.getElementById("transparent_overlay");
    const textP = document.getElementById("confirm_text");
    textP.innerText = text;
    overlay.className = "";
    setFocus("submit_confirm_button");
}

function setFocus(id)
{
    document.getElementById(id).focus();
}

function onSubmitPopup()
{

    const overlay = document.getElementById("transparent_overlay");
    overlay.className = "invisible_object";
    if (confirmConfig[0] != null)
    {
        confirmConfig[0](confirmConfig[2]);
    }
    confirmConfig = [null, null, null];
}

function onCancelPopup()
{
    const overlay = document.getElementById("transparent_overlay");
    overlay.className = "invisible_object";
    if (confirmConfig[0] != null)
    {
        confirmConfig[1](confirmConfig[2]);
    }
    confirmConfig = [null, null, null];
}

function failedCall(id)
{
    const xml_string = "<History>" +
                "<infectedId>"+id+"</infectedId>"+
                "<notes></notes>"+
                "<personalFeeling>0</personalFeeling>"+
                "<status>0</status>"+
                "<symptoms></symptoms>"+
                "<timestamp>" + Date.now() + "</timestamp>" +
                "</History>";

    postRequest("history", xml_string);
    clearRightBar();
}

function closeDetailedView(id)
{
    putRequest("infected/unlock/"+id);
    clearRightBar();
}

function submitDetailView(id)
{
    var xml_string = "<History>" +
        "<infectedId>"+id+"</infectedId>"+
        "<notes>"+document.getElementById("notes_area").value+"</notes>"+
        "<personalFeeling>"+(document.getElementById("wellbeing_slider").value)+"</personalFeeling>"+
        "<status>1</status><symptoms>";
    symptoms = document.getElementsByClassName("symptom_checkbox");

    for (var i=0; i<symptomsList.length; i++)
    {
        xml_string += "<symptom>"+parseInt(symptomsList[i])+"</symptom>";
    }
    xml_string +=
        "</symptoms>" +
        "<timestamp>" + Date.now() + "</timestamp>" +
        "</History>";
    postRequest("history", xml_string);
    clearRightBar();
}

function clearRightBar()
{
    detail_bar = 0;
    closeRightBar();
    document.getElementById("infected_detailed_view_right").innerHTML = "";
}