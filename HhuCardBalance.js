/*
* MIT License
*
* Copyright (c) 2020 Benny
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*
* */

let widgetInputRAW = args.widgetParameter;

//As mentioned on the HHU-Card
let geldboersenID;

//Get Geldbörsen Id from the parameter field.
if (widgetInputRAW !== null) {
    geldboersenID = widgetInputRAW.toString()
} else console.error("Bitte geben Sie die Geldbörsen ID. Sie finden dies auf der Rückseite Ihrer HHU Card")

//GET request
const url = "https://api.topup.klarna.com/api/v1/STW_DUSSELDORF/cards/" + geldboersenID + "/balance";

var today = new Date()
let cacheMinutes = 60 * 1 * 1000

// Set up the file manager.
const files = FileManager.local()

// Set up cache
const cachePath = files.joinPath(files.cacheDirectory(), "widget-hhucard-balance")
const cacheExists = files.fileExists(cachePath)
const cacheDate = cacheExists ? files.modificationDate(cachePath) : 0

// Get data
let result
let lastUpdate

try {
    // If cache exists and it has been less than 1 minute since last request, use cached data.
    if (cacheExists && (today.getTime() - cacheDate.getTime()) < (cacheMinutes)) {
        console.log("Get from cache")
        result = JSON.parse(files.readString(cachePath))
        lastUpdate = cacheDate
    } else {
        console.log("Get from API")
        const req = new Request(url)
        result = await req.loadJSON()
        lastUpdate = today
        console.log("Write data to cache")
        try {
            files.writeString(cachePath, JSON.stringify(result))
        } catch (e) {
            console.error("Creating cache failed!")
            console.error(e)
        }
    }
} catch (e) {
    console.error(e)
    if (cacheExists) {
        console.log("Get from Cache")
        result = JSON.parse(files.readString(cachePath))
        lastUpdate = cacheDate
    } else {
        console.log("No fallback to cache possible. Due to missing cache.")
    }
}

let balance = (result.balance / 100).toString() + "€"

//Set up the widget
let widget = new ListWidget();

if (!balance) {
    widget.addText('Unable to get HHU-Card balance. Please check logs.')
} else {
    widget.setPadding(10, 10, 10, 10)
    widget.backgroundColor = new Color('#0173ba')

    //Title
    const title = widget.addText("Meine HHU Card")
    title.font = Font.largeTitle()
    title.textColor = Color.white()
    title.centerAlignText()
    title.minimumScaleFactor = 0.5
    title.lineLimit = 1

    widget.addSpacer(5)

    //Display Time
    const time = widget.addText("Heute: " + today.toLocaleTimeString());
    time.font = Font.thinMonospacedSystemFont(15);
    time.textColor = Color.white()
    time.centerAlignText()

    widget.addSpacer(5)

    //Message
    const message1 = widget.addText("Zuletzt erfasstes");
    message1.font = Font.regularSystemFont(15)
    message1.textColor = Color.white()
    message1.centerAlignText()
    message1.minimumScaleFactor = 0.5
    message1.lineLimit = 1

    const message2 = widget.addText("Guthaben:");
    message2.font = Font.regularSystemFont(15)
    message2.textColor = Color.white()
    message2.centerAlignText()
    message2.minimumScaleFactor = 0.5
    message2.lineLimit = 1

    const pointText = widget.addText(balance)
    pointText.font = Font.semiboldMonospacedSystemFont(36)
    pointText.textColor = Color.white()
    pointText.centerAlignText()
    pointText.minimumScaleFactor = 0.5
    pointText.lineLimit = 1

    widget.addSpacer()
}

if (!config.runsInWidget) {
    await widget.presentSmall()
} else {
    // Tell the system to show the widget.
    Script.setWidget(widget)
    Script.complete()
}
