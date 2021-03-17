#!/bin/bash
rm releases/psjs_chrome.zip
zip -r releases/psjs_chrome.zip background.js common.js content_scripts/ icons manifest.json options/ popup/
