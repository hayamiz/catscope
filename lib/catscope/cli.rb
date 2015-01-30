# coding: utf-8

require 'catscope/app'
require 'optparse'

module Catscope

class CLI
  def initialize()
    @pwd = Dir.pwd
    setup_parser()
  end

  def setup_parser()
    @parser = OptionParser.new
  end

  def run(argv)
    @parser.parse!(argv)
    App.run!
    true
  end
end

end #module

