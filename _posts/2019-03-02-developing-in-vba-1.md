---
title: "Developing in VBA (1)"
tags:
 - blog
 - VBA
---

Almost half a year ago I left academia in search of greener pastures; seeing the
title of this post you would naturally assume that this did not go particularly
well, but this post isn't about that. Rather, having made a serious attempt at
doing "serious programming" in VBA for a while now I wanted to write about my
experiences, and if I am lucky I might provide some tips for others who find
themselves in a similar situation.

> After having started typing this out I realised that it was getting way too
> long, and I have decided to split it into multiple parts. This first part will
> function as an introduction to the shortcomings of the language I am trying
> surmount. In the second part I will document the things I have learned about
> VBA by reading other people's code, reading StackOverflow, and
> trial-and-error.

To most people, me included, VBA is a joke. It is the language macros in Excel
is written in, although most macro users do not know this, because one normally
record and run them without ever opening the code editor. This is of course
fine, but it also means that almost all VBA code is written with the "let's just
get this thing to work" mentality (_bodging_ is probably the right word) that
eventually results in unmaintainable blobs of code no one wants to be
responsible for. So, having been put in a situation where you have to develop in
VBA, what do you do? The only sensible thing to do is rather than damning the
language for its shortcomings, try to find patterns which helps you overcome
those deficiencies, and in turn develop high quality, readable, testable, and
extendible code.

## Challenges

To understand why I do things in a certain way in VBA it is useful to list some
of the issues with VBA, and why I sometimes choose roundabout ways of solving
seemingly straight forward problems.

### Namespaces and scoping

My currently biggest annoyance and unsolved problem with VBA is it's utter lack
of scoping. Everything in a project is automatically available in the global
namespace, cluttering the autocompletion and making it so that if you e.g.
delete a function named `Foo` in one module, you can't guarantee that the code
wont instead use `Foo` from a different module. What makes this issue even worse
is that every module and every class in a VBA project sees every other module
and class in that project. You can't protect yourself from these mismatches by
simply not including other sources of this function. As far as I can see it
there are three workarounds for this.

#### 1. Prefixing function and class names

This is the tried and true method used for decades by library developers in C.
As C also lacks namespaces, one normally solves this by prepending the function
name with the namespace it belongs to:

{% highlight vb %}
Public Function MyNameSpace_MyFunction()
{% endhighlight %}

There are a couple of issues with this approach:

 1. If you want nested namespaces the function name becomes really long, which
    is normally would just be a nuisance, but in VBA you are limited to a maximum
    variable/function name length of 255 characters.

 2. The IDE autocomplete will loose a lot of its usefulness as you have to
    navigate to the correct function after having started typing the namespace
    name.

 3. You shouldn't really use `_` as a namespace separator as this is a reserved
    symbol VBA uses to imply that you are implementing an inherited interface
    method. There are other symbols you could use, e.g. `-`, however although
    this is a valid character for a function name, it requires that the name
    is "bracketed" when referring to it. E.g. if you want to use a function
    named `MyNamespace-MyFunction`, you have to do that by calling
    `[MyNamespace-MyFunction]()`.


#### 2. Never refer to a function without its module name

This isn't really a solution but more of a methodology. If you are adamant about
always specifying the module a function is specified in when you use it then you
avoid some of the issues mentioned at the beginning of this section. For example
if you change `Foo` in `Module1` then the compiler will complain at every instance
of `Module1.Foo()`. Besides not actually being a safeguard as it is way to easy
to simply forget, it is also unable to implement multi-level namespacing.

#### 3. Replace modules with empty static classes

Finally, rather than putting your functions in modules, which is what makes
sense, you can make use of VBA's somewhat obscure static classes. We will look
at these closer in the next post, but you can create these by setting the
`PredeclaredId` flag for you class

{% highlight vb %}
Attribute VB_PredeclaredId = True
{% endhighlight %}

If this option is `True` (which by default it is not) then VBA creates a default
instance of the class, which much like a singleton exists as a unique instance.
This might not sound like a very good idea, but it allows you to write things
such as

{% highlight vb %}
Result = MyClass.Foo()
{% endhighlight %}

instead of having to first create an instance of you class

{% highlight vb %}
Dim ClassInstance As New MyClass
Result = ClassInstance.Foo()
{% endhighlight %}

As class functions are not available in the global namespace this will make them
unavailable if you do not prefix your calls with `MyClass`, effectively creating
a strict namespace. There are potential overhead issues with this approach, but
in certain situations it might be worth it nevertheless.

You can also multi level namespacing this way by having a top-level namespace
class return the default instance of a lower level namespace class. You can also
achieve namespace aliasing through assigning these static classes to variables.

### Values, objects, and references

In VBA there are two different types of "things": there are values, like
integers, booleans, strings, and floating point numbers, and then there are
objects, which for simplicity's sake is anything that is a class. For someone
with a C++ background then values are just values, while objects are thinly
veiled shared pointers. So far so good, the issue here is that for some unknown
reason, someone decided that the assignment operator has to function differently
for the two things. Thus if you have two variables `x` and `y`, and you want to
assign `y` to `x` then you have to write one of two cases depending on whether
they are values or objects:

{% highlight vb %}
x = y      ' If they are values
Set x = y  ' If they are objects
{% endhighlight %}

In general this is fine as you normally know which of the two cases to use[^1],
however, as `Variant` is a fairly commonly used concept in VBA code you need a
utility function every time you want to carry out an assignment of two
`Variant`s.

{% highlight vb %}
'@Description("Assign Rhs to Lhs.")
Public Sub AssignVariants(ByRef Lhs As Variant, ByVal Rhs As Variant)
  If VBA.IsObject(Rhs) Then
    Set Lhs = Rhs
  Else
    Lhs = Rhs
  End If
End Function
{% endhighlight %}

The existence of `Set` is documented in [Microsoft's guidelines for converting
VBA code to .Net][set-documentation], and they have the following to say:

> **Set Keyword**. In VBA, the **Set** keyword is necessary to distinguish
> between assignment of an object and assignment of the default property of the
> object. Since default properties are not supported in Visual Basic .NET, the
> **Set** keyword is not needed and is no longer supported.

This is of course a valid reason, because how else would you set a class'
default member if that default member doesn't take any arguments[^2], but it
doesn't make a VBA programmer's life any easier, and I would much have preferred
if one say needed an explicit `Let` if that is what one wanted to do.

Another issue with objects being dressed up shared pointers instead of conveying
that to the programmer is that it makes it impossible to pass an object to a
function as an immutable argument. If you give your object reference to a
function, there is no way you can guarantee that that function won't change any
of your objects properties without coding multiple interfaces for each of your
objects, like a `ReadWriteInterface` and a `ReadOnlyInterface`.

### UDT's and arrays

First a quick explanation, UDT is short for _User Defined Type_, and is simply a
wrapper for a collection of variables. One might as well treat them as `structs`
in C, except that they do not interact particularly well with the rest of VBA. I
have also included arrays in this section as they exhibit some of the same types
of difficulties.

Earlier we mentioned that VBA distinguished between values and objects in a
loose way. Of these two categories UDT's and arrays both fall under the former,
namely values. Thus if you assign a UDT to another UDT you will get a clone, and
not a shared reference, same with arrays. Well, you will get a clone to the
extent that is possible, if your UDT contains an object then the clone will
share a reference to that object with the source as objects cannot be cloned
natively. This seems completely reasonable until you try to use them in
functions and classes, and discover some of their flaws

#### 1. UDT's and arrays can't be passed by `ByVal` to functions

This first restriction is more of an annoyance than it is a problem, other than
that I do not see any reason it has to be this way. As we have already seen, you
can assign one UDT to another with ease, so why can't you pass it by value?
Truthfully, I have no idea, and for some reason you can't cheat by forcing it to
a copy by wrapping it in braces either like you can with other values

{% highlight vb %}
Public Sub PassByValue()
  Dim Value As String: Value = "Hello"

  ChangeToWorld (Value)
  Debug.Print Value  ' Prints "Hello"

  ChangeToWorld Value
  Debug.Print Value  ' Prints "World"
End Sub

Private Sub ChangeToWorld(ByRef Value As String)
  Value = "World"
End Sub
{% endhighlight %}

However, we learned earlier that you can't pass objects as immutable arguments
to functions either, so in that regard it isn't in any way worse. It is mostly
that it feels like missing potential as you **should** be able to do this.

##### 2. UDT's and arrays can't be public members of classes

The second restriction is that UDT's and arrays can't be public members of
classes. For arrays this is actually fine as it forces you to write better
interfaces through setters and getters, but for UDT's it makes them completely
useless. This is because UDT's are as I mentioned earlier values, and although
you pass them by reference to functions, VBA has no concept of a by reference
return value. Thus if you have a type

{% highlight vb %}
Public Type OptionalLong
  Has As Boolean
  Value As Long
End Type
{% endhighlight %}

and a class containing it

{% highlight vb %}
' Class OptionalValueHolder
Private mValue As OptionalLong

' Setters and getters
Public Property Get Value() As OptionalLong
  Value = mValue
End Property

' Setters and getters
Public Property Let Value(ByRef Value As OptionalLong)
  mValue = Value
End Property
{% endhighlight %}

and try to use this class

{% highlight vb %}
Public Sub TestClass()
  Dim ValueHolder As New OptionalValueHolder

  ValueHolder.Value.Has = True  ' This does nothing
  ValueHolder.Value.Value = 42  ' Neither does this
End Public
{% endhighlight %}

then the intuitive way of using it does absolutely nothing because you are
modifying a clone that instantly goes out of scope after the assignment. This
means that to use UDT's in classes you have to either modify a copy and then
replace the class' members all at once, or you have to make setters and getters
for all of your UDT's members, meaning you might as well just have individual
class members. They do however have a use in classes as we will see in the next
post.

### Other problems

Finally I will summarise some additional issues that do not get their own
section

 1. Probably the most unintuitive array indexing system I have ever seen. Arrays
    can be 0-indexed, 1-indexed, or any number you want really. This can also be
    specified on a module by module basis, but for instance specifying a
    0-indexed module does not mean that you get 0-indexed arrays in the way you
    are familiar with

    ``` vb
    ' Great, let's use 0-indexed arrays
    Option Base 0

    ' This array has 6 elements because the indices are inclusive
    Dim Arr(5) As Long
    ```

    On top of this the standard libraries aren't even consistent with whether
    they return 0-indexed or 1-indexed results. `Worksheet.Range(...).Value`
    is 1-indexed while `VBA.Split()` is 0-indexed.

 2. Constructors take no arguments, and there is no way of creating a
    constructor that takes one without using factory methods. Wait for the next
    post to see how this can be done.

    A side effect of not allowing constructors take arguments is that it makes
    writing well encapsulated code sort of difficult as you have to write public
    helper functions that affect the private internals of a class after its
    construction.

 3. The error handling exists but really hard to work with. The only way of
    actually controlling it is through goto's, believe it or not. It is actually
    so bad that one will frequently find code on SO where the programmer rather
    turns the error handler off rather than having to actually handle the errors
    "the correct way".

## Wrap-up

In this post we have seen some of the issues with VBA that lay the foundation
for the various coding patterns I will present in the next post. Although this
seems like a long list, it has nothing compared to javascript, and that is one
of the most used languages in the world these days. If they can find ways to
make that language usable, then there is hope for making VBA usable as well.


[^1]: Although forgetting `Set` is probably my most common mistake, bundled
      together with the fact that there isn't really any way of finding these
      mistakes other than stepping through your code with a debugger.

[^2]: I would argue that using a default member that doesn't take any arguments
      is in general a really bad idea as it makes your code harder to read. It
      signals that you want your class to be something it is not. There is a
      reason this was removed from .NET.

[set-documentation]: https://docs.microsoft.com/en-us/previous-versions/office/developer/office-2003/aa192490(v=office.11)
