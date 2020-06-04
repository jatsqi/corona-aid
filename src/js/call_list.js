function initCallList()
{

    var callListsXML = loadXMLDoc("./example_xmls/call_list.xml");
    var prioCalcXSL = loadXMLDoc("./xslt_scripts/xslt_calculate_prio.xsl");
    console.log(callListsXML);
    console.log(prioCalcXSL)

    var ret = runXSLT(prioCalcXSL, callListsXML);
    console.log(ret);
    var displayCallXSL = loadXMLDoc("./xslt_scripts/xslt_call_list.xsl");
    runXSLTDisplayHtml(displayCallXSL, ret, "call_list_div");
}