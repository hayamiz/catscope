# coding: utf-8

require 'sinatra/base'
require 'sinatra/assetpack'
require 'pathname'
require 'json'

module Catscope

class App < Sinatra::Base
  TOP_DIR = Pathname.new(Dir.pwd).realpath
  register Sinatra::AssetPack

  assets do
    serve '/assets/img', from: File.expand_path('../../../assets/img', __FILE__)
    serve '/assets/js', from: File.expand_path('../../../assets/js', __FILE__)
    serve '/assets/stylesheets', from: File.expand_path('../../../assets/stylesheets', __FILE__)
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

  get('/file/*') do
    path = File.expand_path(params[:splat][0].gsub(/^\//, ""), TOP_DIR.to_s)
    name = File.basename(path)
    if name =~ /\.([a-z0-9]+)$/
      ext = $~[1]
    else
      ext = nil
    end

    case ext
    when /^jpe?g$/i
      content_type "image/jpeg"
    when /^png$/i
      content_type "image/png"
    else
      content_type "text/plain"
    end

    File.open(path)
  end

  # API for filelist
  get('/api/lsdir/*') do
    content_type "text/json"

    path = File.expand_path(params[:splat][0].gsub(/^\//, ""), TOP_DIR.to_s)

    entries = Dir.entries(path).select do |name|
      ![".", ".."].include?(name)
    end.map do |name|
      Dir.chdir(path) do
        entry_pathname = Pathname.new(File.expand_path(name, path))
        entry = {
          :name => name,
          :path => "/" + entry_pathname.relative_path_from(TOP_DIR).to_s
        }
        if File.directory?(name)
          entry[:type] = :dir
        elsif File.file?(name)
          entry[:type] = :file
        end
        entry[:id] = Digest::MD5.hexdigest(entry[:path])

        entry
      end
    end

    entries.to_json
  end
end

end # module
