#!/bin/perl

# http://stackoverflow.com/questions/13989907/whats-the-couchdb-attachments-md5-digest-format
# http://search.cpan.org/dist/Digest-MD5/MD5.pm
$fname = $ARGV[0];

# http://stackoverflow.com/questions/1037784/how-can-i-calculate-the-md5-hash-of-a-wav-file-in-perl
# http://stackoverflow.com/questions/14694721/perl-and-php-md5-file-checksum-doesnt-match?rq=1
use Digest::MD5;
open (my $fh, '<', $fname) or die "Can't open '$fname': $!";
binmode ($fh);
my $checksum = Digest::MD5->new->addfile($fh)->b64digest;
print($checksum."\n");
