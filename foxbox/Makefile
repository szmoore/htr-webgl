# Makefile
# Stolen from IPDF (thanks sulix)

ARCH := $(shell uname -m)

# In case we want to run a Windblows HTR server
ifeq ($(ARCH), win32)
	CXX = i686-w64-mingw32-g++ -std=c++11 -g -Wall -Werror -Wshadow -pedantic
else
	CXX = g++ -std=c++11 -g -Wall -Werror -Wshadow -pedantic -rdynamic
endif
RM = rm -f

BIN = foxbox
MAIN = main.o
OBJ = 
LIB_x86_64 = -lfoxbox -pthread
LIB_i386 =
LIB_i686 = $(LIB_i386)
LIB_win32 = -mwindows -lmingw32

CFLAGS_x86_64 := 
CFLAGS_i386 := 
CFLAGS_i686 := $(CFLAGS_i386)
CFLAGS_win32 := 

LIB := $(LIB_$(ARCH)) -L../../lib
CFLAGS := $(CFLAGS_$(ARCH)) -I../../include

LINKOBJ = $(OBJ)

run : $(BIN)
	pkill -2 $(BIN) || echo
	xdotool search --desktop 0 "Firefox" windowactivate
	d=$(pwd)
	./$(BIN) $(ARGS)

$(BIN) : $(LINKOBJ) $(MAIN) $(LINKOBJ)
	echo $(LINKOBJ)
	$(CXX) $(CFLAGS) -o $(BIN) $(LINKOBJ) $(MAIN) $(LIB)
	

	
%.o : %.cpp
	$(CXX) $(CFLAGS) -c -o $@ $<

%_asm.o : %_asm.S
	$(CXX) -c -o $@ $<

clean_bin :
	$(RM) $(BIN)

clean :
	$(RM) $(BIN) $(DEPS) $(LINKOBJ) $(MAIN)

clean_full: clean
	$(RM) *.*~
	$(RM) *~



	
