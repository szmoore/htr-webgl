VERSION := 1.21.2
VERSION_NAME := omega
NAME := humphrey
PACKAGE := rabbitgame.net.$(NAME)
MINSDK := 19
APP_LABEL := Humphrey the Rabbit
ACTIVITY_NAME := MainActivity

define MANIFEST_VARIABLES
VERSION
VERSION_NAME
PACKAGE
NAME
MINSDK
APP_LABEL
ACTIVITY_NAME
endef

MAKEFLAGS := -rR

ANDROID_HOME ?= /usr/lib/android-sdk
export ANDROID_HOME

ANDROIDSDK := $(ANDROID_HOME)/build-tools/debian
PLATFORM := $(ANDROID_HOME)/platforms/android-23/android.jar
SRC := src/$(subst .,/,$(PACKAGE))/
RES := res
DEX := dex
DEXFILE := $(DEX)/classes.dex

CACHE = $(TMPDIR)/$(CURDIR)/

findfiles = $(wildcard $(1))$(foreach d,$(wildcard $(dir $(1))*),$(call findfiles,$(d)/$(notdir $(1))))
JAVA = $(call findfiles,$(SRC)*.java)
CLASSES = $(patsubst %.java,%.class,$(JAVA))

RESOURCES = $(call findfiles,$(RES)*)

KEYSTORE := .secrets/keystore.jks
KEYPASS := .secrets/keypass
STOREPASS := .secrets/storepass

ESCAPE = printf "%q" "$$(cat $(1))"

APK := $(NAME).apk
MANIFEST := AndroidManifest.xml

ADB_START_ARGS = $()

.ONESHELL:
.SECONDEXPANSION:

TRACESHELL := #-x
SHELL := bash
.SHELLFLAGS := -e -u -o pipefail $(TRACESHELL) -c
RECIPE = @echo "$@:"

define GITCRYPT_RECIPE
$(RECIPE)
trap 'git stash && git-crypt lock && git stash apply | head -n1' EXIT
git stash
git-crypt unlock || echo "$@: Failed unlock" 1>&2
git stash apply | head -n1
endef

.DEFAULT_GOAL := install-and-launch
install-and-launch: apk install launch;
environment:
	$(RECIPE)
	apt-get install make android-sdk android-sdk-platform-23 \
		git-crypt

apk: $(APK);
$(APK): $(APK:.apk=.aligned.apk) | $(KEYSTORE) $(STOREPASS) $(KEYPASS)
	$(GITCRYPT_RECIPE)
	 apksigner sign --ks $(KEYSTORE) --ks-key-alias androidkey \
		--ks-pass pass:$$($(call ESCAPE,$(STOREPASS)))  --key-pass pass:$$($(call ESCAPE,$(KEYPASS))) \
		--out $@ $<
	aapt dump badging $@

keystore: $(KEYSTORE)
$(KEYSTORE): | $(STOREPASS) $(KEYPASS)
	$(GITCRYPT_RECIPE)
	keytool -genkeypair -keystore $@ \
		-alias androidkey -validity 10000 -keyalg RSA -keysize 2048 \
		-storepass $$($(call ESCAPE,$(STOREPASS))) -keypass $$($(call ESCAPE,$(KEYPASS)))
	if [ ! -f $@ ]; then
		echo "$@ not created" 1>&2
		exit 1
	fi


$(APK:.apk=.aligned.apk): $(APK:.apk=.unsigned.apk)
	$(RECIPE)
	zipalign -f -p 4 $< $@

$(APK:.apk=.unsigned.apk): $(DEXFILE) $(MANIFEST)
	$(RECIPE)
	aapt package -f -v -F $@ -I $(PLATFORM) -M $(MANIFEST) -S res dex

$(CLASSES): $(JAVA)

dex: $(DEXFILE);
$(DEXFILE): $(CLASSES) $(SRC)R.java $(MAKEFILE_LIST)
	$(RECIPE)
	mkdir -p "$(dir $@)"
	$(ANDROIDSDK)/dx --dex --verbose --min-sdk-version=$(MINSDK) --output=$@ src

$(SRC)MainActivity.class: $(JAVA) $(SRC)R.java
	$(RECIPE)
	javac -bootclasspath $(PLATFORM) -classpath src -source 1.7 -target 1.7 $^

$(SRC)R.java: $(MANIFEST) $(RESOURCES)
	$(RECIPE)
	aapt package -f -m -J src -S res -M $(MANIFEST) -I $(PLATFORM)

manifest: $(MANIFEST);
$(MANIFEST): $(MANIFEST:.xml=.template.xml) $(MAKEFILE_LIST)
	$(RECIPE)
	cp $< $@
	sed -i $(foreach v,$(MANIFEST_VARIABLES),-e 's/{$(v)}/$($(v))/g') $@

install: $(APK)
	$(RECIPE)
	adb install -f "$(APK)"

launch:
	$(RECIPE)
	adb shell am start -n $(PACKAGE)/$((PACKAGE).$(ACTIVITY_NAME)

clean:
	rm -vf	$(SRC)R.java \
		$(SRC)*.class \
		*.unsigned.apk \
		*.aligned.apk \
	rm -rvf dex

unlock: relock
	$(RECIPE)
	git stash
	git-crypt unlock
	git stash apply

relock: $(CACHE)relock.pid;
.cache/relock.pid $(CACHE)relock.pid: | $(CACHE)
	$(RECIPE)
	mkdir -p "$(dir $@)"
	ANCESTOR="$(shell ps --no-header -o ppid:1 | head -n1)"
	ps -o pid,cmd -p "$${ANCESTOR}"
	export ANCESTOR
	nohup bash << EOF > $(CACHE)relock.log 2>&1 & echo $$! > $@
		trap 'git stash; git-crypt lock --force; git stash apply; rm -v $@' EXIT;
		while kill -0 $${ANCESTOR}; do
			sleep 1;
			date
			ps -o pid,cmd -p "$${ANCESTOR}"
		done
	EOF

.cache cache: $(CACHE);
$(CACHE):
	mkdir -p $@
	ln -s $@ .cache

distclean: clean
	rm -vf $(APK)
