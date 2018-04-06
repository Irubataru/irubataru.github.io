---
title: "openQCD-FASTSUM v1.0 released"
tags:
 - projects
---

After having worked on extending openQCD to fit the needs of my collaboration
(FASTSUM) for almost a year and a half, I am able to release it to the public
with reasonable confidence that it works.

In our quest towards studying the behaviour of hadrons closer and closer to
physical quark masses we had to move away from the chroma lattice code for a
couple of different reasons; the most important reason was as is quite often the
case in the lattice community, performance. The big question was then, which
code to choose. At the time we considered three options

1. __openQCD__ - this code is widely used by the community and has an impressive
   number of state of the art algorithmic improvements over other candidates,
   most importantly deflation techniques which lessen the numerical burden of
   simulating close to physical quark masses.

   However, the code did not implement anisotropic lattice actions, nor stout
   smearing for the gauge links, but of which were absolutely necessary to for
   us to extend our previous study. On top of this, openQCD is written in the
   C89 standard and is littered with short incomprehensible names and global
   variables, but of which making further development a nightmare.

2. __HiRep__ - from the name it is quite obvious that the code is intended to do
   lattice simulations for QCD-like theories using either different gauge groups
   or different group representations. Although more would have to be done for
   this code, as it was missing both the features mentioned above as well as the
   nice optimisations from openQCD, it had the advantage of being written in
   semi-modern (in academic terms, thus actually being ancient) C++, and would
   therefore be easier to extend and develop for. On top of this it was actively
   developed by members of a second lattice group here in Swansea, and could
   therefore lead to a more tight-knit collaboration.

3. __chroma__ - Finally we could dig into chroma and see if we could actually
   fix some of the performance woes we were experiencing.

In the end, as is quite obvious from the post title, we decided to start
modifying openQCD. Although I was not particularly happy about this at first,
due to the fact that I'd prefer to use modern features of C++ rather than being
stuck with C89, I have over time grown to enjoy working with this code quite a
bit. I have no other explanation than it being a prime example of _Stockholm
syndrome_.

And a year and a half later, we have finally arrived here...

The brunt of the work was obviously spent developing the two missing features,
namely anisotropic actions and stout smeared gauge links, but I will not focus
on those in this blog post. Rather I'd like to mention the modifications I made
to the code to keep myself sane.

## vim setup

Although my vim setup wasn't any different in this case to how it always is for
C/C++ projects, I can safely say that I would never have made it without. The
possibility to easily navigate to declarations and definitions with [YCM][ycm],
together with [CtrlSpace][ctrlspace] which allowed me to properly organise my
vim buffers so that I always had the plethora of spurious `README` files
properly organised made wading through this 150k line monstrosity a breeze.

The most important lines of my vimrc for this project were thus

``` vim
Plug 'vim-ctrlspace/vim-ctrlspace'

" C/C++ specific
Plug 'ervandew/supertab' |
      \  Plug 'Valloric/YouCompleteMe', 
            \{ 'for': ['cpp', 'javascript', 'c', 'python', 'tex'],
Plug 'drmikehenry/vim-headerguard', {'for': ['cpp', 'hpp'] }
Plug 'rhysd/vim-clang-format', { 'for': ['cpp', 'hpp', 'c'] } |
      \ Plug 'kana/vim-operator-user'
```


## Formatting 

The first thing I did when I pulled the code was to run it through an
auto-formatter. My code formatter of choice is of course clang-format
:two_hearts:

I have still not fully come to terms with how to integrate auto-formatters with
a source control work flow, as far as I see it there is no particularly elegant
way of doing it. Specially if you ever decided to make changes to your style
definitions in the middle of development (which I did), this will leave you with
a very unsatisfactory commit, or series of commits, that change a lot of lines,
but no actual code (as long as your formatter isn't broken).

This annoyance aside, having a code that is orders of magnitude easier on the
eyes than the original source definitely helped keep the fatigue at bay.

At the very end of development, due to a very scary macro expand bug which can
be summarised as a very short example

``` c
#define add(x, y)   \
  *(x).a += *(y).a; \
  *(x).b += *(y).b

/* I had no idea this was a macro function */
for (i = 0; i < LENGTH; ++i)
  add(x + i, y + i);
```

I felt the sudden need to enforce braces around all control statements in the
code, and thus I had my first use case for clang-tidy. Basically I ran
clang-tidy with the option 

```
-checks="readability-braces-around-statements" -fix
```

which automatically adds braces around all statements for which they have been
left out.


## Testing


## Building


## const


## The future


[ycm]: https://github.com/Valloric/YouCompleteMe
[ctrlspace]: https://github.com/vim-ctrlspace/vim-ctrlspace/
