#!/bin/bash
rm releases/sara_chrome.zip
zip -r releases/sara_chrome.zip background.js content_scripts/ icons manifest.json options/ popup/
