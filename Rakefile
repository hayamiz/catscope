require "bundler/gem_tasks"

task :default => :assets

desc "compile assets"
task :assets do
  Dir.chdir("assets") do
    sh "bundle exec compass compile"
  end
  cp "./assets/bower_components/zeroclipboard/dist/ZeroClipboard.swf", "./static/"
end

desc "run 'bower update'"
task :bower_update do
  Dir.chdir("assets") do
    sh "bower update"
  end
end

task :build => [:bower_update, :assets]
