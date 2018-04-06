---
title: "openQCD-FASTSUM v1.0 released"
tags:
 - projects
---

After having worked on extending openQCD to fit the needs of my collaboration
(FASTSUM) for almost a year and a half, I am finally able to release it to the
public with reasonable confidence that it works.

In our quest towards studying the behaviour of hadrons closer and closer to
physical quark masses we had to move away from the chroma lattice code for a
couple of different reasons; the most important reason was as is quite often the
case in the lattice community, performance. The big question was then, which
code to choose. At the time we considered three options

1. __openQCD__ - this code is widely used by the community and has an impressive
   number of state of the art algorithmic improvements over other candidates,
   most important are deflation techniques which lessen the numerical burden of
   simulating close to physical quark masses.

   However, the code does not implement anisotropic lattice actions, nor stout
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


## vim set-up

Although my vim set-up wasn't any different in this case to how it always is for
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
be summarised through this short example

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
lot simpler and has the added benefit of being organised in a unit testing
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

The code also needed a new build system. Originally the `main` folder had a
Makefile, while every testing directory had its own makefile. Running make also
placed all `.o` files and all `.d` files in the folder make was run. This by
itself is of course only an issue in terms of tidiness, however, openQCD is
also designed in such a way that the lattice size and parallelisation are hard
coded through a set of declare statements in a header file

``` c
#define NPROC0 4
#define NPROC1 8
#define NPROC2 8
#define NPROC3 8

#define L0 8
#define L1 4
#define L2 4
#define L3 4
```

As a result one generally need multiple builds of the program for a standard
use case. I thus decided to redo the Makefile to fix these issues. Preferably I
would build everything with bazel, but as this is software used by physicist on
HPC clusters on which modern software is hard to come by, I decided against
this. For my new build system I had a couple of targets

 - _A portable build_, one should be able to build the code from anywhere. On
   Linux this is most commonly achieved through the configure -> make pattern; I
   am not a fan and wanted to achieve this by other means.

 - _A configurable build_, one should not have to touch the source to configure
   the build. Specifically I wanted to move the aforementioned `#define`
   statements to a configure file so that it would be easier to keep separate
   builds for separate lattice geometries.

 - _A tidy build_, as previously mentioned I was also aiming for a clean build
   in which `.o` and `.d` files were placed in sub directories that mimicked
   the folder structure from where the source was located.

 - _Logical build targets_, the original Makefile only had a single (reasonable)
   target in most cases. For the rewrite I wanted targets that were both
   granular and made sense to the user. This meant single targets for each of
   the executables, targets for the testing modules, as well as targets to
   create static libraries from the individual modules, and documentation targets.

 - _Build informatics_, I generally prefer it when the output of the program
   somehow tells you from where it came and how it was built; in modern software
   the most useful identifier is probably the git SHA. I also wanted to record
   which compiler flags the users chose to pass. This is because the intrinsics
   instruction set the code uses is determined by the user by setting flags such
   as `-DAVX -DPM`, and this information is invaluable for debugging later.

With these goals in mind I set out on a quest to build the ultimate `Makefile`.
Although I have been an active Make user for many years, this knowledge has
been aggregated through years of trial, error, and Googling. For this project I
needed something more, and picked up [Managing Projects with GNU
Make][make-book] by Robert Mecklenburg which taught me a lot about Make I never
knew.

In the end I chose to adapt an idea first explored by the Swansea Academy of
Advanced Computing (SA2C) who had been struggling with some of the same issues.
The idea was to have a separate `compile_setting.txt` file which contained all
of the user settings, and then have Make parse these settings. The config file
would look something like this

```
CODELOC ..
COMPILER /usr/bin/mpicc
MPI_INCLUDE /usr/include/mpi

CFLAGS -std=c89 -O2 -DAVX -DFMA3 -Werror -Wall
LDFLAGS
```

Here you see that `CODELOC` tells the Make where to find the source which
enabled out of directory builds. In hindsight I would rather have had these
settings at the very top of the Makefile for users to edit instead of having two
separate files, but this will be a task for another time.

A more detailed explanation of the build system can be found on the [build
system documentation][makefile-readme].


## const

My final order of business on my zealous quest to bring this code into this
century, and have it adhered to what is considered best practice, was _const
correctness_. I have always liked const correctness, it makes sense, it is not
too hard to implement, and it will hopefully catch a couple of bugs in the
process. This is specially true for this code as the argument order of basic
algebraic functions such as `+=` can only be classified as a feat in
inconsistency.

My dreams of a _const correct_ future were promptly crushed when a grep for
`const` in the repository only resulted in a handful of static const variable
declarations. I decided to soldier through and added const to about 70% of the
code base. The remaining 30% couldn't be fixed due to the fact that the boundary
of the gauge field (a local buffer of the values of the neighbouring MPI
processes) were considered fair game regardless of whether the object should
have been left unmodified or not. Fixing this would require a not insignificant
change to the flow of the code, something I was not going to do to achieve const
correctness alone.


## The future

Now that the code has been released and given a release tag it is time to look
to the future. Besides fixing bugs I have a couple of further additions I want
to make

 - _Unit testing_: as mentioned previously I feel the code would certainly
   benefit from having a proper unit testing framework, specially if I could
   hook it up to some sort of CI. As some of the tests actually require HPC
   resources to compute in a reasonable time, I would need to run these jobs
   remotely, but I see that as an interesting challenge.

 - _Propagator computation code_: for our project we require quark propagators
   to be computed, which in turn require the fermion matrix to be inverted. We
   could use chroma for this task, however that would put us back to square one
   as inverting the fermion matrix is the very reasons we were having
   performance issues in the first place. Instead of simply adding another
   "main" program to the main folder, I'd rather made it a standalone thing. For
   this I would need...

 - _Creating a library_: although openQCD was never meant to be anything else
   than a standalone code I am starting to see its potential as a standalone
   library one could hook into when developing new software. On top of
   facilitating the creation of a propagator computation code it would also make
   my openQCD <-> chroma conversion programs that are necessary for us to make
   use of chroma's fairly extensive analysis component.
 
As you can see there are quite a lot left to do in the limited time I have left
of my contract.

I hope this post has helped illuminate some of the obstacles I have faced
creating openQCD-FASTSUM v1.0. On top of being useful to my group and the
physics community at large, I would love it if this version was the one other
groups made changes to for their own extensions as it has been updated in quite
a few ways that alleviates potential developer fatigue.

You can check our the code homepage [here][fastsum].


[ycm]: https://github.com/Valloric/YouCompleteMe
[ctrlspace]: https://github.com/vim-ctrlspace/vim-ctrlspace/
[bug]: https://bugs.llvm.org/show_bug.cgi?id=36866
[unit-testing-question]: https://stackoverflow.com/questions/748503/how-do-you-introduce-unit-testing-into-a-large-legacy-c-c-codebase
[googletest-for-C]: https://meekrosoft.wordpress.com/2009/11/09/unit-testing-c-code-with-the-googletest-framework/
[unit-testing-framework]: https://gitlab.com/fastsum/openqcd-fastsum/tree/master/devel/testing_utilities
[make-book]: http://www.oreilly.com/openbook/make3/book/index.csp
[makefile-readme]: https://fastsum.gitlab.io/documentation/build-system/
[fastsum]: https://fastsum.gitlab.io/
