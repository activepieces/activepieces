CC ?= cc
CFLAGS ?= -O2 -Wall -Wextra -Werror -std=c11
LDFLAGS ?= -static

ap-sandbox-launcher: ap-sandbox-launcher.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS) -lseccomp

clean:
	rm -f ap-sandbox-launcher

.PHONY: clean
