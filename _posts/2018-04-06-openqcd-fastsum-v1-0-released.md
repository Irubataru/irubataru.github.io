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
definitions in the middle of development (which I did); this will leave you with
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
left out. I also encountered [an interesting bug][bug], but it wasn't anything a
quick python script couldn't deal with.


## Testing

The next order of business was to implement some sort of testing. Ideally I
would introduce a full fledged unit testing framework, set up CI, and let
computers do the rest; it was however not that easy.

I started by looking for good unit testing frameworks for C, and came across
[this great question][unit-testing-question] on stackoverflow, I also looked
into using the GoogleTest framework to test C code, something [this blog
post][googletest-for-C] describes. Unfortunately, the existing tests would need
a complete rewrite to work together with a unit testing framework, something I
did not have the time for.

As an intermediate step I opted to roll a very tiny per-file unit testing
"framework" myself. This is far from ideal, but it made writing my own tests a
lot simples and has the added benefit of being organised in a unit testing
layout where one registers tests. The framework code can be seen
[here][unit-testing-framework]. A typical use case would look like this

``` c
new_test_module();

register_test(1, "Partial boundary copies su3_dble");
print_test_header(1);
fail_test_if(1, /* test clause */);

report_test_results();
```

The `report_test_results()` function would pretty print the test results and
list all failed tests if any. I am pretty pleased with the result, at least
considering its simplicity.

Towards the end of the project is when testing became a bit more important to
guarantee that I hadn't broken anything my decision to not spend a month or so
properly implementing a unit testing framework finally hit me. openQCD has over
150 tests, most of which had to be run at different layers of optimisations and
with different boundary conditions. In addition to that they also generally do
not result in a clear "success/failure" state, but rather give absolute
differences where one should have a feel for what is the accepted tolerance for
that particular function. Running through all the tests typically took me an
hour or so of manual work and is definitely something I would do different if I
were to start over again.
 

## Building


## const


## The future


[ycm]: https://github.com/Valloric/YouCompleteMe
[ctrlspace]: https://github.com/vim-ctrlspace/vim-ctrlspace/
[bug]: https://bugs.llvm.org/show_bug.cgi?id=36866
[unit-testing-question]: https://stackoverflow.com/questions/748503/how-do-you-introduce-unit-testing-into-a-large-legacy-c-c-codebase
[googletest-for-C]: https://meekrosoft.wordpress.com/2009/11/09/unit-testing-c-code-with-the-googletest-framework/
[unit-testing-framework]: https://gitlab.com/fastsum/openqcd-fastsum/tree/master/devel/testing_utilities
