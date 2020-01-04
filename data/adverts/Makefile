
SVG_FILENAMES = $(wildcard *.svg)
QUIET = @

.ONESHELL:
SHELL := /bin/bash
.SHELLFLAGS := -e -c

# Generate index.json
index.json: $(SVG_FILENAMES) Makefile
	$(QUIET)
	(
		echo "["
		true $(foreach f,$(SVG_FILENAMES), && echo '    "$(f)",') | head -c -2
		echo ""
		echo "]"
	) > $@
	jq '.' $@ || ( cat $@ 1>&2 && rm -f $@ )