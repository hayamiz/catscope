require "bundler/gem_tasks"

desc "compile assets"
task :assets do
  Dir.chdir("assets") do
    sh "bundle exec compass compile"
  end
end

desc "run 'bower update'"
task :bower_update do
  Dir.chdir("assets") do
    sh "bower update"
  end
end

task :build => [:bower_update, :assets]
