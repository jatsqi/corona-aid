function parseNodeValueFromXML(xmlObj, tagName) {
    return xmlObj.getElementsByTagName(tagName)[0].childNodes[0].nodeValue;
}

function init() {
    showLoading();
    loadConfig();
    initMap();
    calculatePriorities();
    makeAsyncUpdateProcess();
    connectWebSocket();
    window.onbeforeunload = function() {
        cleanUp();
    };
    setTimeout(hideLoading, 1000);
}

function realtimeUpdate(updateXML) {
    let serializer = new XMLSerializer();
    let xmlString = "";
    let items = updateXML.children[0].getElementsByTagName("item");
    for (let index = 0; index < items.length; index++) {
        xmlString += serializer.serializeToString(items[parseInt(index)]);
    }
    updateXMLStr += xmlString;
    runUpdate();
}

function connectWebSocket() {
    let evtSource = new EventSource(apiUrl + "realtime/sse");

    evtSource.onmessage = function(e) {
        let parser = new DOMParser();
        let xmlDocument = parser.parseFromString(e.data, "application/xml");
        if (xmlDocument.children[0].nodeName !== "EmptySet") {
            realtimeUpdate(xmlDocument);
        }
    };
}

function loadConfig() {
    // init configs
    let configXML = loadXMLDoc(apiUrl+"config", "application/xml", configLoadErrorFn);

    if (!configXML) return;
    let items = configXML.getElementsByTagName("item");
    for (let i=0; i<items.length; i++) {
        configHashTable[parseNodeValueFromXML(items[parseInt(i)], "configKey")] =
            parseNodeValueFromXML(items[parseInt(i)], "configValue");
    }
}

function configLoadErrorFn(statusCode) {
    switch (statusCode) {
        case 404:
            makeConfirmPopup("Die Konfigurationen konnten nicht geladen werden.\n" +
                "Es werden Standardkonfigurationen ausgewählt.\n" +
                "Die Website wird vermutlich nicht funktionieren.",
                null, null, true, "Schließen");
            configHashTable = {"standardLat":"49.013868","standardLon":"8.404346", "clusteredDistance": "200",
                "pieChartScale":"0.6","markerScale":"0.3","standardZoom":"13","zoomChange":"0.5", "animationDuration" : 200};
            break;
        case 502:
        case 503:
            serviceUnavailableError();
            break;
    }
}

function serviceUnavailableError() {
    makeConfirmPopup("Der Server ist nicht erreichbar.\n" +
        "Gehen Sie einen Kaffee trinken, doch verbrennen Sie sich nicht.\n" +
        "Falls der Fehler in 15 Minuten erneut auftritt, melden Sie sich unter:\n" +
        "<a href=\"mailto:support@corona-aid-ka.de\">support@corona-aid-ka.de</a>", null, null, null, true, "Schließen");
    document.getElementById("cancel_confirm_button").className += " invisible_object";
    document.getElementById("search_bar").className += " invisible_object";
    document.getElementById("zoom_buttons").className += " invisible_object";
}

async function runUpdate() {
    if (updateXMLStr === "" || suppressUpdates) return;
    //let serializer = new XMLSerializer();
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString("<root></root>", "application/xml");
    xmlDoc.children[0].appendChild(parser.parseFromString("<updateList>" + updateXMLStr + "</updateList>", "application/xml").children[0]);
    xmlDoc.children[0].appendChild(deepCopyXML(prioList).children[0]);

    let updateXSL = getXSLT("./xslt_scripts/xslt_realtime_update.xsl");

    prioList = runXSLT(updateXSL, xmlDoc);
    initCallList(false);
}

function makeAsyncUpdateProcess() {
    updatePromise = setInterval(function(){runUpdate();}, configHashTable["frontendRefreshIntervall"]);
}

function enforceUpdate() {
    if (!updatePromise) clearInterval(updatePromise);

    runUpdate();
    makeAsyncUpdateProcess();
}

function cleanUp() {
    if (detailBarMode === 2) {
        // unlock infected
        postRequest("infected/unlock/"+currentInfectedId);
    }
}

function showProgressBar() {
    let progressXSL = getXSLT("./xslt_scripts/xslt_progressbar.xsl");
    runXSLT(progressXSL, prioList, "progressBarDiv");
}