# Image 2.6 GIF gallery

The gallery adapts the React components, layout and CSS from freestylefly's GPT Image 2 site. The base stylesheet comes from commit `53d3927ee3c45f6c54a12d86aabcf5c921670e11`. GIF-specific rules live in `src/gif-gallery.css`. The upstream author and MIT notice are in [LICENSE](LICENSE). [Pinned upstream](https://github.com/freestylefly/awesome-gpt-image-2/tree/53d3927ee3c45f6c54a12d86aabcf5c921670e11) · [Development fork](https://github.com/dongyu19920904/awesome-gpt-image-2)

## Run locally

From this directory, run `npm ci` and `npm run dev`. To test the static build, run `npm run build` and `npm run preview`.

## Data and media

- [Gallery media](data/gallery-media.json) contains creator GIF links, exact licensed prompts and per-case attribution. The playable examples currently use the creator's text prompts.
- [Case catalog](../data/cases.json) adds original source links for reference-image, WeChat and other cases.
- [X source index](../data/x-materials.json) supplies the searchable source list. Its reviewed X posts and the playable GIFs are counted separately.

The build uses relative asset paths and a `?case=` query link for shareable details. Media links stay pinned to their source revision.

The site serves Noto Sans SC as a font fallback for Chinese text. [Font license](public/OFL-Noto-Sans-SC.txt)
