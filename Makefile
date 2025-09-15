.PHONY: all
all: put-together

.PHONY: put-together
put-together: yosina-spec/_site/ja/spec/index.html landing-page/out/index.html
	mkdir -p _site
	rsync --recursive yosina-spec/_site/ _site/
	rsync --recursive landing-page/out/ _site/

yosina-spec/_site/ja/spec/index.html:
	cd yosina-spec && deno run build

landing-page/out/index.html:
	cd landing-page && npm run build


