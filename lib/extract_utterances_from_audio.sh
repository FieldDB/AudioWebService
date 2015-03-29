#!/bin/bash

# Running Praat on Mac via LaunchDeamon is failing https://discuss.atom.io/t/how-to-execute-node-js-child-process-from-package/4880/2
# "textGridInfo": "Command failed: /bin/sh -c /Applications/Praat.app/Contents/MacOS/Praat praat-script-syllable-nuclei-v2file.praat -20 4 0.4 0.1 no \"Instructions_TDFM\"   \"Instructions_TDFM.mp3\"\n",
# echo $PATH
# echo ""
# echo "Running command: "
# echo "1 $1 2 $2 3 $3 4 $4 5 $5 6 $6 7 $7 8 $8 9 $9"
# echo ""
# /Applications/Praat.app/Contents/MacOS/Praat $1 $2 $3 $4 $5 $6 $7 $8 $9 

# Workaround with placeholder TextGrid until we fix  https://github.com/OpenSourceFieldlinguistics/FieldDB/issues/1932

cat lib/praat_segfault_workaround.TextGrid > "$7/$8.TextGrid"
# wait 1
cat lib/praat_segfault_workaround.json
