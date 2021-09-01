#!/bin/bash

BBB_HOSTNAME=$(pass euroforth/bbb/hostname) BBB_SECRET=$(pass euroforth/bbb/secret) node test.js $*
