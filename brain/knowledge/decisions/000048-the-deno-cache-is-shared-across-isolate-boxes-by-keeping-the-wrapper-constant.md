---
title: The deno cache is shared across isolate boxes by keeping the wrapper constant
icon: 🔥
status: accepted
---

# The deno cache is shared across isolate boxes by keeping the wrapper constant

the general idea for this change is that:
Deno needs to write a cache dir (DENO_DIR) which should not be readable by anyone unless the owner .

what I did first time I worked on it is that I made it write this dir inside the os.temp folder   but it will be deleted in non re-usable mode and I had to delete it immediatly after the run finishes ( because in re-usable sandbox mode runs share the folder so if i don't delete it a run can have access to all previous run cache dirs ) .

the problem with this now . is there is no cache . so deno has to do lot of work which makes every code step takes >200ms ( was ~60-90ms :sweat_smile: )

So I had to find something . which is
write the deno_dir inside the flow version code folder ( /root/codes/flowVersionId/.deno-cache ) and never delete it.
the issue was that in sandbox modes ( runs engine via isolate ) must have write access to that folder to save the cache .

so I had to make the isolate process be able to read/write the  folder ( /root/codes/flowVersionId/.deno-cache )  but only in non re-usable mode
Because in re-usable mode the mounts are fixed when the sandbox process starts, and a reusable sandbox does not yet know which flow versions it will serve.

So right now in summary it's like this:

1. SANDBOX_PROCESS / SANDBOX_CODE_AND_PROCESS with re-usable sandbox: Cache dir lives in os.tmpdir() "/box" and gets deleted immediatly , so every code step is cold ( if we are sure that this mode is trusted we can skip deletion , confirm with mo ) . this is not the default , AP_REUSE_SANDBOX unset = false for isolate modes

2. SANDBOX_PROCESS / SANDBOX_CODE_AND_PROCESS with re-usable sandbox set to false ( production ): Cache dir is per flow version ( /root/codes/flowVersionId/.deno-cache ) mounted :rw and saved between runs ( big win 200ms -> 90ms when warm , verified on all 5 boxes of the preview )

3. UNSANDBOXED / SANDBOX_CODE_ONLY ( engine forked on the host , no isolate ): same per flow version cache dir , reached directly on the host fs , kept between runs regardless of the re-usable flag . no mount needed

4. in all modes the cache only holds step code now ( inputs are not inlined anymore , see below ) , and in isolate modes only the flow version's own cache dir is mounted into the box , so a run can't reach another flow's cache

one thing to keep in mind: the cache dir sits one level above the step dirs , so the content-hash invalidation that wipes /root/codes/fv/step doesn't touch it . deno keys by content so stale entries are harmless but the folder only goes away with the flow version's code dir

## The wrapper change ( why the shared cache was still slow )

after the mount was in place the preview still showed no difference between cold and warm :sweat_smile: . turns out one more catch in isolate: each box id runs as its own uid ( 60000 + boxId ) and the box ids are a fixed pool that gets reused across runs even with AP_REUSE_SANDBOX=false . the first box that fills the cache owns the files ( 644 / 755 ) so the other boxes could read it but not write into it .

that was fine for the sqlite caches ( tested: pre-seeding them as 666 changed nothing ) . the real problem was the stdin program we feed to deno . it had a random nanoid marker + the inlined inputs in it , so every run was a brand new module and deno tried to write a new transpiled copy of it in gen/ . the write failed for every non-owner uid and the run ended up slower than cold ( ~240ms vs ~150ms cold vs ~85ms warm ) .

the fix: make the program byte-identical per step so there is nothing new to write after the first fill .
- the marker is generated inside the wrapper ( crypto.randomUUID() ) and printed as the first stdout line ( __AP_DENO_MARKER__<marker> ) , the parent reads it back from there
- the inputs go to a temp json file ( os.tmpdir()/ap-deno-data-*/data.json ) passed as Deno.args[0] with its own --allow-read , deleted when the process exits
- deno.run takes a `data` param instead of the caller inlining it , and the engine body calls mod.code(data)

side effects: no chmod at all except 0777 on the cache root , 644 files / 755 dirs serve every uid , a changed step costs one normal run instead of a cold start , and the cache never contains run inputs anymore . the wrapper also binds console.log before user code runs so a step can't fake the result line .
