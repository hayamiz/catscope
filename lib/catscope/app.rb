# coding: utf-8

require 'sinatra/base'
require 'sinatra/assetpack'

module Catscope

class App < Sinatra::Base
  register Sinatra::AssetPack

  assets do
    serve '/assets/js', from: File.expand_path('../../../assets/js', __FILE__)
    serve '/assets/bower_components', from: File.expand_path('../../../assets/bower_components', __FILE__)

    js :modernizr, [
                    '/assets/bower_components/modernizr/modernizr.js',
                   ]

    js :libs, [
               '/assets/bower_components/jquery/dist/jquery.js',
               '/assets/bower_components/foundation/js/foundation.js'
              ]

    js :application, [
                      '/assets/js/app.js'
                     ]

    js_compression :jsmin
  end

  get('/') do
    erb :index
  end
end

end # module
