# coding: utf-8

require 'sinatra/base'

module Catscope

class App < Sinatra::Base
  get('/') do
    erb :index
  end
end

end # module
