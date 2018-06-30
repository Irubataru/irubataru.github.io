---
title: "Converting jekyll themes"
tags:
 - blog
---

I took a break form web development after my last spout of website creations and
haven't really touched it since. However, recently a co-worker asked me for help
hooking him up with a website for his a cappella group, and as I am incapable of
saying no, I thought, why not?

So, I am neither experienced with, not good at, web development; I still find it
strange, and CSS remains an enigma. However, as mentioned in the opening post I
did find jekyll fairly appealing. Thus, when I was tasked with building a
website for a scientific event ([Dirac Day 2018](http://pyweb.swan.ac.uk/diracday/))
I turned to jekyll (there are more interesting subjects related to the creation
of that webpage, but I will have to leave that for later). After spending some
time looking through jekyll themes I decided on a classic HTML5UP theme named
[alpha](https://html5up.net/alpha), and found that someone had already done the
job of [converting this to
jekyll](https://github.com/andrewbanchich/alpha-jekyll-theme). "Great!", I
thought, downloaded the theme and started looking at making a page with that as
a base. Unfortunately, I quickly realised that a lot of jelyll conversions are
in fact not very good. They don't really make use of any of the jekyll features
to make utilising the themes as simple as possible. "I can do better than that",
I decided, and here we are.

The whole point of jekyll (and static site generators in general) is to avoid
the tedium of writing long-form HTML and CSS, and rather have something that
just "did the right thing". I therefore approached this task attempting to do a
couple of things in a jekyll-like way:

 1. Every part of the HTML document that feels like a component, should be a
    component that could be included with a
    {% raw %}
    ```
    {% include compnent.html %}
    ```
    {% endraw %}
 2. Site navigation should be handled through a YAML file.

 3. There should exist sensible layouts for what you want to do, and they should
    have YAML-header arguments that made sense for the context they were
    designed for.

I have now done this conversion on two HTML5UP themes,
[alpha](https://github.com/Irubataru/alpha-jekyll-theme), and more recently
[massively](http://irubataru.com/massively-jekyll-theme/). Alpha I converted for
the Dirac Day website, and now I am working on massively for the a cappella
group. I don't feel done with either of them, but massively in particular I want
to look into using the jekyll post parsing to see if I can create a list of
posts on the main site. This is probably one of the biggest features of jekyll,
and something I have yet to learn properly.

There are still a couple of things I don't know how to do in jekyll that I am
interested in finding a solution to:

 1. Quite a few webpages have a page of elements, where the elements themselves
    can either be similar or different. E.g. with the material design principle
    a page could consist of multiple cards. It would be great if you in jekyll
    could easily specify your own begin/end environment so that a user could
    write
    {% raw %}
    ``` ruby
    {% card %}
      content...
    {% endcard %}
    ```
    {% endraw %}
    Rather than the more traditional

    ``` html
    <div class="card">
      content...
    </div>
    ```

    which in this case is not necessarily more verbose, but it requires that the
    user knows more about the HTML/CSS, something I sort of want to get away
    from. It would also allow for a couple of interesting use cases. One
    solution would be to make `card_begin.html` and `card_end.html` elements
    which can then be used through
    {% raw %}
    ```
    {% include card_begin.html %}
      content...
    {% include card_end.html %}
    ```
    {% endraw %}
    This is an OK temporary solution, but I am not all that happy with it.

 2. Better integration between jekyll and CSS. This is probably a problem with
    me not understanding the system rather than with the system itself. My
    general gripe is just that I can't write jekyll/liquid in the files in my
    `_sass` folder. The only solution I have found so far is to have snippets of
    CSS in your include folder, and include those in a jekyll-way at the same
    time as you include the rest of your SASS in a SASS-way. Again, doesn't feel
    all that elegant.

All in all though I am happy that I go through with these conversion projects.
It is not as if I am actually creating something _new_ while I am doing this,
but I am learning a lot about both jekyll and traditional HTML/CSS as I have
to interact with both systems when creating a theme. And who knows, maybe at
some point I will be able to create my own theme for this blog and make it a bit
more personal.
