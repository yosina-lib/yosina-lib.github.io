.PHONY: all
all: put-together

.PHONY: put-together
put-together: yosina-spec/_site/ja/spec/index.html landing-page/out/index.html yosina/_site/api
	mkdir -p _site
	rsync --recursive yosina-spec/_site/ _site/
	rsync --recursive landing-page/out/ _site/
	rsync --recursive yosina/_site/api _site/
	find _site/api/swift -name '*.html' -exec \
		perl -pi -e 's|var baseUrl = "/"|var baseUrl = "/api/swift/"|g; s|href="/|href="/api/swift/|g; s|src="/|src="/api/swift/|g' \
		{} +

yosina-spec/_site/ja/spec/index.html:
	cd yosina-spec && git apply ../yosina-spec.patch && deno run build

landing-page/out/index.html:
	cd landing-page && npm run build

yosina/_site/api:
	cd yosina && $(MAKE) install-deps && $(MAKE) --touch codegen && $(MAKE) docs
