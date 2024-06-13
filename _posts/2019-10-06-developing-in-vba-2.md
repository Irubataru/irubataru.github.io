---
title: "Developing in VBA (2)"
tags:
 - blog
 - VBA
---

This is a continuation of the previous post about VBA where I will try to
document some of the tricks and workarounds I utilise on a daily basis in an
attempt to drag VBA into the current decade.

## Writing VBA code

Before we go anywhere with VBA we have to look at how one writes VBA. Although
one can obviously manipulate VBA's `.bas` and `.cls` files anywhere, there isn't
any IDE's out there that supports the fileformat nearly as well as the VBE
(Visual Basic Editor); unfortunately this editor hasn't seen any updates in a
very long time and not only lacks the conveniences us programmers have gotten
used to having such as powerful code inspection, refactoring tools, and unit
test runners, but also lack basic functionality such as the option to manipulate
VB attributes and source code organisation.

This is where Rubberduck comes in to save the day as the second best solution to
having your code editable in a modern editor with proper plugin support.

### Rubberduck

[Rubberduck][rubberduck-git] is a COM add-in for the VB IDE that adds a lot of
useful features that I would never have been able to live without. To me the two
most important are code organisation and its unit testing framework.

## Coding VBA

 * Classes vs UDT's
 * Inheritance vs composition (?)
 * Predeclared classes, the default instance, and constructors/factories
 * The "this" member
   * Setters and getters, arrays
 * Compile variables and statements
 * Looping through enums
 * Source control
 * Error handling
 * Fake namespaces

[rubberduck-git]: https://github.com/rubberduck-vba/Rubberduck
