# LogRum #

LogRum is a simple web-based log tailer inspired by [clarity][1] and a 
desire to satisfy my curiosity in node.js.

# Installation #

## Dependencies ##

See [package.json][3]

## Steps ##

1. npm install
2. edit config/config.yml (see config.yml.example)
3. NODE\_ENV=production npm start


# Caveats #

* client doesn't purge old lines unless you switch log files

# TODO #

* SSL
* Multi user auth

# Attributions & License #

LogRum is released under a BSD License. See [LICENSE][2].

<hr/>

Portions of the HTML & CSS are copied verbatim from [clarity][1] and are
subject to the following MIT license:

<pre>
Copyright © 2009 Tobias Lütke

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the ‘Software’), to 
deal in the Software without restriction, including without limitation the 
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
sell copies of the Software, and to permit persons to whom the Software is 
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ‘AS IS’, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
</pre>


  [1]: https://github.com/tobi/clarity
  [2]: https://github.com/hobodave/logrum/blob/master/LICENSE
  [3]: https://github.com/hobodave/logrum/blob/master/package.json
