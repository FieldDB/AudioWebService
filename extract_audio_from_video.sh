#!/bin/bash

WORK=$HOME/fielddbworkspace/AudioWebService/utterances/$1
PRAAT=$HOME/fielddbworkspace/AudioWebService/praatfiles
cd $WORK

# Extract any audio from the video track and 
# convert it to 16-bit WAV format.
ffmpeg -i $WORK/$2 -vn -acodec libmp3lame -ac 1 -ab 128k $WORK/$1.mp3
echo "Conversion complete."

# Run praat script to generate TextGrid file.
if [ ! "$(command -v praat)" ]; then
  exit 0
else
  praat $PRAAT/praat-script-extract-utterances.praat $WORK/ /*.mp3
fi
