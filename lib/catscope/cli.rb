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

    @bind = '127.0.0.1'
    @parser.on('-o', '--bind ADDRESS', "IP address to bind (default: #{@bind})") do |addr|
      @bind = addr
    end

    @port = 4567
    @parser.on('-p', '--port PORT', "Port to listen on (default: #{@port})") do |port|
      @port = Integer(port)
    end

    @environment = "production"
    @parser.on('-e', '--env ENV', "Rack environment (default: #{@environment})") do |env|
      @environment = env
    end
  end

  def run(argv)
    @parser.parse!(argv)

    App.set :environment, @environment
    App.set :bind, @bind
    App.set :port, @port

    App.run!
    true
  end
end

end #module

