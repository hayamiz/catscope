# coding: utf-8

require 'sinatra/base'
require 'sinatra/assetpack'
require 'sinatra/rocketio'
require 'pathname'
require 'json'

module Catscope

class App < Sinatra::Base
  EPS_MIN_PIXELS = 1024*1024 / 2
  TOP_DIR = Pathname.new(Dir.pwd).realpath

  register Sinatra::AssetPack
  register Sinatra::RocketIO

  set :server, :thin
  set :rocketio, :websocket => false, :comet => true
  set :cometio, :timeout => 120, :post_interval => 2, :allow_crossdomain => false

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
               '/assets/bower_components/foundation/js/foundation.js',
               '/assets/bower_components/jquery-ui/jquery-ui.min.js',
               '/assets/bower_components/zeroclipboard/dist/ZeroClipboard.js',
               '/assets/bower_components/alertify.js/lib/alertify.js'
              ]

    js :application, [
                      '/assets/js/app.js'
                     ]

    js_compression :jsmin

    css :libs, [
                '/assets/bower_components/alertify.js/themes/alertify.core.css',
                '/assets/bower_components/alertify.js/themes/alertify.default.css'
               ]
  end

  helpers do
    def type_by_path(path)
      name = File.basename(path)
      if name =~ /\.([a-z0-9]+)$/
        ext = $~[1]
      else
        ext = nil
      end

      case ext
      when /^jpe?g$/i
        return "image/jpeg"
      when /^png$/i
        return "image/png"
      when /^(eps|svg)$/i # will be converted to png
        return "image/png"
      when /^pdf/i
        return "application/pdf"
      else
        return "text/plain"
      end
    end

    def image_size(file_path)
      unless system("which identify >/dev/null 2>&1")
        return nil
      end

      identify_str = `identify "#{file_path}"`
      unless identify_str =~ /\s(\d+)x(\d+)\s/
        return nil
      end
      [$~[1].to_i, $~[2].to_i]
    end
  end

  io = Sinatra::RocketIO
  @@watching_files = []
  EM.kqueue = true if EM.kqueue?

  io.on :start do
  end

  module FileChangePusher
    def file_modified
      puts("file_modified path: #{path}")
      Sinatra::RocketIO.push :file_modified, path
    end

    def file_moved
      puts("file_moved path: #{path}")
      Sinatra::RocketIO.push :file_moved, path
    end

    def file_deleted
      puts("file_deleted path: #{path}")
      Sinatra::RocketIO.push :file_deleted, path
      if File.exists?(path)
        EM.watch_file(path, FileChangePusher)
        puts("still exists")
      end
    end

    def unbind
      puts("unbind #{path}")
    end
  end

  io.on :open_file do |data, client|
    puts("open_file: path = #{data}, client = #{client}" )
    if @@watching_files.include?(data)
      @@watching_files.push(data)
    end

    EM.watch_file(data, FileChangePusher)
  end

  io.on :close_file do |data, client|
    puts("close_file: path = #{data}, client = #{client}" )
    if @@watching_files.include?(data)
      @@watching_files.delete(data)
    end
  end

  get('/') do
    erb :index
  end

  get('/file/*') do
    path = File.expand_path(params[:splat][0].gsub(/^\//, ""), TOP_DIR.to_s)

    content_type type_by_path(path)

    File.open(path)
  end

  get('/preview/*') do
    path = File.expand_path(params[:splat][0].gsub(/^\//, ""), TOP_DIR.to_s)

    content_type type_by_path(path)

    if path =~ /\.(eps|svg)$/
      imgsize = image_size(path)

      p imgsize

      resize_option = ""
      if imgsize && imgsize[0]*imgsize[1] < EPS_MIN_PIXELS
        dpi = (72 * ((EPS_MIN_PIXELS / (imgsize[0]*imgsize[1]).to_f)) ** 0.5).to_i
        resize_option = "-density #{dpi}"
      end

      convert_cmd = "convert #{resize_option} \"#{path}\" png:-"
      out = IO.popen(convert_cmd)
      puts(convert_cmd)
    else
      out = File.open(path)
    end

    out
  end

  get('/save/*') do
    path = File.expand_path(params[:splat][0].gsub(/^\//, ""), TOP_DIR.to_s)

    send_file(path)
  end

  get('/static/*') do
    url_path = params[:splat][0].gsub(/^\//, "")
    path = File.expand_path(url_path, File.expand_path("../../../static", __FILE__))

    send_file(path)
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
          :path => entry_pathname.relative_path_from(TOP_DIR).to_s
        }
        if File.directory?(name)
          entry[:type] = :dir
        elsif File.file?(name)
          entry[:type] = :file
        end
        entry[:id] = Digest::MD5.hexdigest(entry[:path])

        entry
      end
    end.sort_by do |entry|
      entry[:name]
    end

    entries.to_json
  end
end

end # module
