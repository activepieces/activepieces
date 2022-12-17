package com.activepieces.common;

import java.io.File;

public class Constants {

    public static final String HOME_PATH = (new File(System.getProperty("user.home")).exists() ? System.getProperty("user.home") : "/root") + File.separator + "activepieces";
    public static String ACTIVEPIECES_WORKER_ABS_PATH_JS = HOME_PATH + File.separator + "activepieces-worker.js";
    public static String WORKER_OUTPUT_FILE = "output.json";
    public static String WORKER_EXECUTE_FLOW_ARG = "execute-flow";
    public static String WORKER_EXECUTE_TRIGGER_ARG = "execute-trigger";
    public static String WORKER_APPS_ARG = "components";
    public static String WORKER_OPTIONS_ARG = "options";
    public static String WORKER_TRIGGER_TYPE_ARG = "trigger-type";

    public static String ACTIVEPIECES_WORKER_JS = "activepieces-worker.js";
    public static String WORKER_RESULT_IN_MAP = "result";
    public static String RUN_RESULT_IN_MAP = "run";
}
