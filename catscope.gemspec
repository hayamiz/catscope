# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'catscope/version'

Gem::Specification.new do |spec|
  spec.name          = "catscope"
  spec.version       = Catscope::VERSION
  spec.authors       = ["Yuto Hayamizu"]
  spec.email         = ["y.hayamizu@gmail.com"]
  spec.summary       = "On-demand web-based file browser"
  spec.description   = "Catscope is an on-demand web-based file browser."
  spec.homepage      = "http://github.com/hayamiz/catscope/"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0")
  spec.files        += Dir.glob("assets/bower_components/**/*")
  spec.files        += Dir.glob("assets/stylesheets/**/*")
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_dependency "thin", "~> 1.6"
  spec.add_dependency "sinatra", "~> 1.4"
  spec.add_dependency "sinatra-rocketio", "~> 0.3"
  spec.add_dependency "sinatra-assetpack", "~> 0.3.3"
  spec.add_dependency "tilt", "~> 1.4"

  spec.add_development_dependency "bundler"
  spec.add_development_dependency "rake"
  spec.add_development_dependency "sass"
  spec.add_development_dependency "compass"
end
