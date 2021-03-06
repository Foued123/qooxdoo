/* *****************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2014 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Richard Sternagel (rsternagel)

***************************************************************************** */

'use strict';

module.exports = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },

  getTailoredCldrData : function (test) {
    var locales = require('../lib/locales.js');

    console.log(JSON.stringify(locales.getTailoredCldrData("en")));

    test.ok(true);
    test.done();
  }
};
