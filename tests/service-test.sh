#!/bin/bash
function coloredEcho(){
  local exp=$1;
  local color=$2;
  if ! [[ $color =~ '^[0-9]$' ]] ; then
   case $(echo $color | tr '[:upper:]' '[:lower:]') in
    black) color=0 ;;
red) color=1 ;;
green) color=2 ;;
yellow) color=3 ;;
blue) color=4 ;;
magenta) color=5 ;;
cyan) color=6 ;;
        white|*) color=7 ;; # white or invalid color
esac
fi
tput setaf $color;
echo $exp;
tput sgr0;
}


rm -rf bycorpus/testingupload-firstcorpus/

TESTCOUNT=0;
TESTFAILED=0;
TESTSFAILEDSTRING="";
TESTPASSED=0;
TESTCOUNTEXPECTED=5;

# Production server is using http behind nginx
SERVER="https://localhost:3184";
if [ "$NODE_ENV" == "production" ]; then
  SERVER="http://localhost:3184";
  echo "Using $SERVER"
else
  echo "Using $SERVER"
fi

echo ""
echo ""
echo "It should accept short audio"
TESTCOUNT=$[TESTCOUNT + 1]
curl -k -F files[]=@sphinx4files/lattice/10001-90210-01803.wav -F token=mytokengoeshere -F username=testingupload -F dbname=testingupload-firstcorpus $SERVER/upload/extract/utterances | grep averageSylableDuration ||{
	TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : It should accept short audio"
};

echo ""
echo ""
echo "It should accept amr audio from androids"
TESTCOUNT=$[TESTCOUNT + 1]
cp 13157700051593730_2011-09-11_15.41_1315770072221_.mp3 13157700051593730_2011-09-11_15.41_1315770072221_.amr
curl -k -F files[]=@13157700051593730_2011-09-11_15.41_1315770072221_.amr -F token=mytokengoeshere -F username=testingupload -F dbname=testingupload-firstcorpus $SERVER/upload/extract/utterances | grep averageSylableDuration ||{
	TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : It should accept amr audio from androids"
};

echo ""
echo ""
echo "It should accept multiple files"
TESTCOUNT=$[TESTCOUNT + 1]
curl -k -F files=@tests/data/alo.mp3 -F files=@tests/data/ara.mp3 -F token=mytokengoeshere -F username=testingupload -F dbname=testingupload-firstcorpus $SERVER/upload/extract/utterances | grep averageSylableDuration ||{
	TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : It should accept multiple files"
};

echo ""
echo ""
echo "It should accept long movies $TRAVIS"
if [ $TRAVIS ]; then
  echo "  skipping due to large file not present in TRAVIS: $TRAVIS"
  TESTCOUNTEXPECTED=4
else
  TESTCOUNT=$[TESTCOUNT + 1]
  curl -k -F files[]=@tests/data/ჩემი\ ცოლის\ დაქალის\ ქორწილი\ \[HD\].mp4 -F token=mytokengoeshere -F username=testingupload -F dbname=testingupload-firstcorpus $SERVER/upload/extract/utterances | grep averageSylableDuration ||{
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : It should accept long movies"
  };
fi

echo ""
echo ""
echo "It should accept .raw audio (from android pocketsphinx and other)"
TESTCOUNT=$[TESTCOUNT + 1]
curl -k -F files[]=@testinstallpocketsphinx/android_16k.raw -F token=mytokengoeshere -F username=testingupload -F dbname=testingupload-firstcorpus $SERVER/upload/extract/utterances | grep averageSylableDuration ||{
  TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : It should accept .raw audio (from android pocketsphinx and other)"
};

echo;
echo;
echo "Result";
echo;

TESTPASSED=$((TESTCOUNT-TESTFAILED));
if [ $TESTPASSED = $TESTCOUNT ]; then
 coloredEcho  "$TESTPASSED passed of $TESTCOUNT" green
else
  coloredEcho  "$TESTPASSED passed of $TESTCOUNT" red
  coloredEcho  " $TESTFAILED tests failed" red
  coloredEcho " $TESTSFAILEDSTRING" red
  exit $TESTFAILED
fi

if [ $TESTCOUNT = $TESTCOUNTEXPECTED ]; then
 coloredEcho  "Ran $TESTCOUNT of $TESTCOUNTEXPECTED expected" green
else
	coloredEcho  "Ran $TESTCOUNT of $TESTCOUNTEXPECTED expected" yellow
  exit 1
fi


# ls noqata_tusunayawami.mp3 || {
# 	curl -O --retry 999 --retry-max-time 0 -C - https://github.com/OpenSourceFieldlinguistics/FieldDB/blob/master/sample_data/noqata_tusunayawami.mp3?raw=true
# 	mv "noqata_tusunayawami.mp3?raw=true" noqata_tusunayawami.mp3
# }

# 15602
