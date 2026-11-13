# Make the AI judge happy — ai-happy-01

A cheerful blue round robot with its arms raised in a sunny wildflower meadow
under a big smiling sun, butterflies drifting past, golden hour light. An
original image made for this entry: one look, instant warmth.

## How the entry works

`main.ts` (Node 22, standard library only, no network) copies `entry.png` —
a JPEG, 1024×1024, 186,474 bytes — to the output directory as `entry.png`,
exactly as it is. The judge sees exactly those bytes.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

It prints the bytes written. Run it twice and the two outputs are byte-identical.

Before copying, the program checks the file itself: the magic bytes must be a
JPEG (`FF D8 FF`) or PNG signature, the size must be at most 1 MiB, and the
dimensions — read from the JPEG's Start Of Frame marker or the PNG's IHDR
chunk — must be at most 1024×1024. Any failed check exits non-zero and writes
nothing.

## License

MIT (see `LICENSE`).
