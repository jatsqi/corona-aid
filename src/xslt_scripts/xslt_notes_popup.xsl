<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template match="InfectedDto">


        <p class="popupHeader">Anmerkungen zu <xsl:value-of select="surname"/>, <xsl:value-of select="forename"/></p>
        <div id="notesHistoryDiv" class="notesDiv">
            <xsl:apply-templates select="historyItems/historyItem[not(notes = '')]"/>
        </div>
        <div id="hideNotesButtonDiv">
        <button id="hideNotesButton" onclick="hidePopUp();" class="dialogButton cancel_button">Schließen</button>
        </div>
    </xsl:template>

    <xsl:template match="historyItem">
        <div id="notesItem">
            <p class="bold_text">Vom <xsl:value-of select="date"/>: <span id="notesText"><xsl:value-of select="notes"/></span></p>
        </div>
    </xsl:template>
</xsl:stylesheet>