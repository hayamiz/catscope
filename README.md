# Catscope: an on-demand web-based file browser

Catscope is a Sinatra-based file browser.  It helps you to make files
accessible via web browsers.

** PLASE BE CAREFUL. Catscope will cause leak of confidential data. **

## Installation

    $ gem install catscope

## Usage

    catscope

And open [http://localhost:4567](http://localhost:4567/) in your
browser. You can see files in the current directory.

By default, catscope accepts connections only from local host.  If you
want to access from remote hosts, run catscope like this:

    catscope --bind 0.0.0.0

**!!BE CAREFUL!!**: this makes files accessible from any reachable
remote hosts.  Filtering connections with firewalls or `iptables` is
strongly recommended when you bind catscope to 0.0.0.0.

## Contributing

1. Fork it ( https://github.com/hayamiz/catscope/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request
