#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_NAME 64
#define MAX_ENTRIES 128

typedef struct {
    char name[MAX_NAME];
    int size;
    int is_directory;
} FileEntry;

typedef struct {
    FileEntry entries[MAX_ENTRIES];
    int count;
} FileList;

void filelist_init(FileList *fl) {
    fl->count = 0;
}

int filelist_add(FileList *fl, const char *name, int size, int is_dir) {
    if (fl->count >= MAX_ENTRIES) {
        return -1;
    }
    FileEntry *e = &fl->entries[fl->count];
    strncpy(e->name, name, MAX_NAME - 1);
    e->name[MAX_NAME - 1] = '\0';
    e->size = size;
    e->is_directory = is_dir;
    fl->count++;
    return 0;
}

void filelist_print(const FileList *fl) {
    printf("%-32s %8s  %s\n", "Name", "Size", "Type");
    printf("%-32s %8s  %s\n", "----", "----", "----");
    for (int i = 0; i < fl->count; i++) {
        const FileEntry *e = &fl->entries[i];
        printf("%-32s %8d  %s\n",
               e->name, e->size,
               e->is_directory ? "dir" : "file");
    }
}

int main(void) {
    FileList list;
    filelist_init(&list);

    filelist_add(&list, "main.go", 2048, 0);
    filelist_add(&list, "server.go", 4096, 0);
    filelist_add(&list, "frontend", 0, 1);
    filelist_add(&list, "go.mod", 512, 0);

    filelist_print(&list);
    return 0;
}
